import os
import json
import pandas as pd
import numpy as np
from datetime import datetime
import pickle
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

from .fetch_data import (
    collect_student_data, 
    get_graduated_student_ids, 
    get_non_graduated_student_ids
)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
MODEL_DIR = os.path.join(DATA_DIR, "model")
os.makedirs(MODEL_DIR, exist_ok=True)

TARGET_RELATED_COLUMNS = [
    'Graduated', 'GraduationLength', 'GraduationYear', 'OnTime',
    'HighGPA', 'Status', 'PassOrFail', 'graduated', 'graduationlength',
    'graduationyear'
]

def preprocess_data():
    """
    Preprocess the collected student data for machine learning.
    Separates graduated and non-graduated students for training and prediction.
    Prints feature names and ensures we don't include target-related columns.
    """
    print("Loading data from CSV files...")
    
    students_csv = os.path.join(DATA_DIR, "all_students.csv")
    if not os.path.exists(students_csv):
        print("Student data file not found. Run data collection first.")
        return None
    
    students_df = pd.read_csv(students_csv)
    print(f"Loaded {len(students_df)} student records")
    
    # Print student dataframe columns to check for leakage
    print("\nStudent dataframe columns:")
    print(students_df.columns.tolist())
    
    exams_csv = os.path.join(DATA_DIR, "all_exams.csv")
    if os.path.exists(exams_csv):
        exams_df = pd.read_csv(exams_csv)
        print(f"Loaded {len(exams_df)} exam records")
        print("\nExams dataframe columns:")
        print(exams_df.columns.tolist())
    else:
        exams_df = pd.DataFrame()
        print("No exam data found")
    
    grades_csv = os.path.join(DATA_DIR, "all_grades.csv")
    if os.path.exists(grades_csv):
        grades_df = pd.read_csv(grades_csv)
        print(f"Loaded {len(grades_df)} grade records")
        print("\nGrades dataframe columns:")
        print(grades_df.columns.tolist())
    else:
        grades_df = pd.DataFrame()
        print("No grade data found")
    
    ### Perform feature engineering
    
    # 1. Calculate exam statistics per student
    if not exams_df.empty:
        if 'Score' in exams_df.columns and 'StudentID' in exams_df.columns:
            # For PassOrFail, check if it's present, otherwise don't use it
            if 'PassOrFail' in exams_df.columns:
                agg_dict = {
                    'Score': ['mean', 'min', 'max', 'std', 'count'],
                    'PassOrFail': ['mean', 'sum']
                }
            else:
                agg_dict = {
                    'Score': ['mean', 'min', 'max', 'std', 'count']
                }
            
            exam_stats = exams_df.groupby('StudentID').agg(agg_dict)
            exam_stats.columns = ['_'.join(col).strip() for col in exam_stats.columns.values]
            exam_stats.reset_index(inplace=True)
        else:
            print("Required columns missing in exams data")
            exam_stats = pd.DataFrame(columns=['StudentID'])
    else:
        exam_stats = pd.DataFrame(columns=['StudentID'])
    
    # 2. Calculate grade statistics per student
    if not grades_df.empty:
        if all(col in grades_df.columns for col in ['PointsEarned', 'PointsAvailable', 'StudentID']):
            # Calculate percentage for each grade
            grades_df['Percentage'] = grades_df['PointsEarned'] / grades_df['PointsAvailable'] * 100
            
            grade_stats = grades_df.groupby('StudentID').agg({
                'Percentage': ['mean', 'min', 'max', 'std', 'count'],
                'PointsEarned': ['sum'],
                'PointsAvailable': ['sum']
            })
            grade_stats.columns = ['_'.join(col).strip() for col in grade_stats.columns.values]
            
            # Add overall percentage
            grade_stats['Overall_Percentage'] = (grade_stats['PointsEarned_sum'] / 
                                               grade_stats['PointsAvailable_sum'] * 100)
            grade_stats.reset_index(inplace=True)
        else:
            print("Required columns missing in grades data")
            grade_stats = pd.DataFrame(columns=['StudentID'])
    else:
        grade_stats = pd.DataFrame(columns=['StudentID'])
    
    # 3. Merge all datasets
    merged_df = students_df.copy()
    if 'StudentID' not in merged_df.columns:
        print("Error: StudentID column not found in student data!")
        return None
    merged_df['StudentID'] = merged_df['StudentID'].astype(int)
    if not exam_stats.empty and 'StudentID' in exam_stats.columns:
        exam_stats['StudentID'] = exam_stats['StudentID'].astype(int)
        merged_df = pd.merge(merged_df, exam_stats, on='StudentID', how='left')
    if not grade_stats.empty and 'StudentID' in grade_stats.columns:
        grade_stats['StudentID'] = grade_stats['StudentID'].astype(int)
        merged_df = pd.merge(merged_df, grade_stats, on='StudentID', how='left')
    merged_df.to_csv(os.path.join(DATA_DIR, 'merged_features.csv'), index=False)
    print(f"Merged dataset saved with {merged_df.shape[0]} rows and {merged_df.shape[1]} columns")
    
    print("\nAll columns in merged dataset:")
    print(merged_df.columns.tolist())
    
    graduated_ids = get_graduated_student_ids()
    non_graduated_ids = get_non_graduated_student_ids()
    
    print(f"Graduated students: {len(graduated_ids)}")
    print(f"Non-graduated students: {len(non_graduated_ids)}")
    
    # Filter for graduated students (for training/testing)
    graduated_df = merged_df[merged_df['StudentID'].isin(graduated_ids)].copy()
    
    # Filter for non-graduated students (for prediction)
    non_graduated_df = merged_df[merged_df['StudentID'].isin(non_graduated_ids)].copy()
    
    print(f"Graduated dataset: {graduated_df.shape[0]} records")
    print(f"Non-graduated dataset: {non_graduated_df.shape[0]} records")
    
    # Check if we have enough data to train a model
    if graduated_df.shape[0] < 10:
        print("Not enough graduated student data for training (need at least 10 records)")
        return None
    
    # For graduated students, prepare features and target
    # Create a binary target: 1 if graduated in <= 4 years, 0 if longer
    if 'GraduationLength' in graduated_df.columns and graduated_df['GraduationLength'].notna().sum() > 10:
        print("\nUsing GraduationLength as target variable (on-time graduation)")
        graduated_df['OnTime'] = (graduated_df['GraduationLength'] <= 4).astype(int)
        y = graduated_df['OnTime']
        
        # Print target distribution
        print("Target distribution:")
        print(y.value_counts())
        
        # List of columns to drop (including target and related columns)
        features_to_drop = TARGET_RELATED_COLUMNS + ['StudentID', 'OnTime']
    else:
        # If no GraduationLength, use CumGPA as a target
        if 'CumGPA' in graduated_df.columns and graduated_df['CumGPA'].notna().sum() > 10:
            print("\nUsing CumGPA as target variable (high GPA = 1, low GPA = 0)")
            graduated_df['HighGPA'] = (graduated_df['CumGPA'] > 3.0).astype(int)
            y = graduated_df['HighGPA']
            
            # Print target distribution
            print("Target distribution:")
            print(y.value_counts())
            
            # List of columns to drop (including target and related columns)
            features_to_drop = TARGET_RELATED_COLUMNS + ['StudentID', 'HighGPA', 'CumGPA']
        else:
            print("\nWarning: No suitable target variable found. Using a dummy target.")
            y = np.ones(graduated_df.shape[0])
            features_to_drop = TARGET_RELATED_COLUMNS + ['StudentID']
    
    # Print columns to be removed
    print("\nColumns to be removed from features:")
    columns_to_remove = [col for col in features_to_drop if col in graduated_df.columns]
    print(columns_to_remove)
    
    # Prepare features for graduated students
    X = graduated_df.drop(columns_to_remove, axis=1, errors='ignore')
    
    # Print the final features used
    # Used when looking back over what the model highlighted
    print("\nFinal features used for training:")
    print(X.columns.tolist())
    print(f"Number of features: {len(X.columns)}")
    
    # Prepare features for non-graduated students (for prediction)
    if not non_graduated_df.empty:
        X_non_graduated = non_graduated_df.drop(columns_to_remove, axis=1, errors='ignore')
        non_graduated_ids_df = non_graduated_df[['StudentID']].copy()
        if 'FirstName' in non_graduated_df.columns and 'LastName' in non_graduated_df.columns:
            non_graduated_ids_df['FirstName'] = non_graduated_df['FirstName']
            non_graduated_ids_df['LastName'] = non_graduated_df['LastName']
    else:
        X_non_graduated = pd.DataFrame()
        non_graduated_ids_df = pd.DataFrame(columns=['StudentID'])
    
    print(f"\nTraining data shape: {X.shape}")
    print(f"Target data shape: {y.shape}")
    print(f"Non-graduated data shape: {X_non_graduated.shape}")
    
    missing_values = X.isnull().sum()
    print("\nFeatures with missing values:")
    print(missing_values[missing_values > 0])
    
    numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_features = X.select_dtypes(include=['object', 'bool']).columns.tolist()
    
    print(f"\nNumeric features: {len(numeric_features)}")
    print(numeric_features)
    print(f"\nCategorical features: {len(categorical_features)}")
    print(categorical_features)
    
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ],
        remainder='drop'
    )
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Print class distribution in train and test sets
    print("\nClass distribution in training set:")
    print(pd.Series(y_train).value_counts())
    print("\nClass distribution in test set:")
    print(pd.Series(y_test).value_counts())
    
    # Fit and transform the training data
    print("\nApplying preprocessing transformations...")
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    # Save some sample processed features to understand transformations
    if hasattr(preprocessor, 'get_feature_names_out'):
        feature_names_out = preprocessor.get_feature_names_out()
        print(f"\nProcessed feature names (first 10):")
        print(feature_names_out[:10])
        print(f"Total transformed features: {len(feature_names_out)}")
    else:
        print("\nCould not get feature names after transformation")
    
    # Transform non-graduated data for predictions
    if not X_non_graduated.empty:
        non_graduated_processed = preprocessor.transform(X_non_graduated)
    else:
        non_graduated_processed = np.array([])
    
    # Save the preprocessor for future use
    with open(os.path.join(MODEL_DIR, 'preprocessor.pkl'), 'wb') as f:
        pickle.dump(preprocessor, f)
    
    print(f"\nPreprocessing complete.")
    print(f"Processed training data shape: {X_train_processed.shape}")
    print(f"Processed test data shape: {X_test_processed.shape}")
    
    # Save feature names for reference
    feature_names = numeric_features + categorical_features
    with open(os.path.join(MODEL_DIR, 'feature_names.json'), 'w') as f:
        json.dump(feature_names, f)
    
    return (X_train_processed, X_test_processed, y_train, y_test, 
            non_graduated_processed, non_graduated_ids_df, merged_df)

def train_and_evaluate_models():
    """
    Train models with adjusted hyperparameters to avoid overfitting.
    """
    # Preprocess the data
    preprocessed_data = preprocess_data()
    if not preprocessed_data:
        print("Data preprocessing failed. Cannot train models.")
        return None, None, None
    
    (X_train, X_test, y_train, y_test, 
     non_graduated_features, non_graduated_ids_df, merged_df) = preprocessed_data
    
    # Define models with adjusted hyperparameters to avoid perfect accuracy
    models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=50,
            max_depth=3,
            min_samples_leaf=5,
            class_weight='balanced',
            random_state=42
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=50,
            max_depth=2,
            learning_rate=0.05, # Lower learning rate
            subsample=0.8,      # Use only 80% of samples per tree
            random_state=42
        ),
        "Logistic Regression": LogisticRegression(
            C=0.1,             # Stronger regularization
            class_weight='balanced',
            random_state=42,
            max_iter=1000
        )
    }
    
    results = {}
    
    # Train and evaluate each model
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train, y_train)
        
        # Evaluate on test set
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        cm = confusion_matrix(y_test, y_pred)
        
        print(f"{name} Metrics:")
        print(f"  Accuracy:  {accuracy:.4f}")
        print(f"  Precision: {precision:.4f}")
        print(f"  Recall:    {recall:.4f}")
        print(f"  F1 Score:  {f1:.4f}")
        print(f"  Confusion Matrix:")
        print(cm)
        
        # Cross-validation score
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1')
        print(f"  Cross-validation F1 score: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # For Random Forest, print feature importances
        # Very useful for looking back even though Gradient boosting was >
        if name == "Random Forest" and hasattr(model, 'feature_importances_'):
            if hasattr(model, 'feature_names_in_'):
                feature_names = model.feature_names_in_
                importances = model.feature_importances_
                indices = np.argsort(importances)[::-1]
                
                print("\nFeature importances:")
                for i in range(min(10, len(feature_names))):
                    print(f"  {feature_names[indices[i]]}: {importances[indices[i]]:.4f}")
            else:
                print("\nFeature importances (top 10):")
                importances = model.feature_importances_
                sorted_indices = np.argsort(importances)[::-1][:10]
                for i, idx in enumerate(sorted_indices):
                    print(f"  Feature {idx}: {importances[idx]:.4f}")
        
        results[name] = {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "confusion_matrix": cm.tolist(),
            "cross_val_mean": cv_scores.mean(),
            "cross_val_std": cv_scores.std()
        }
        
        # Save model
        with open(os.path.join(MODEL_DIR, f"{name.replace(' ', '_')}_model.pkl"), 'wb') as f:
            pickle.dump(model, f)
        
        # Make predictions for non-graduated students if we have any
        # Exclusive event after model is saved and this just works a pass forward and generates a CSV with our goated values
        if len(non_graduated_features) > 0:
            non_grad_predictions = model.predict(non_graduated_features)
            non_grad_prob = model.predict_proba(non_graduated_features)[:, 1]
            
            predictions_df = non_graduated_ids_df.copy()
            predictions_df[f"{name}_Prediction"] = non_grad_predictions
            predictions_df[f"{name}_Probability"] = non_grad_prob
            
            predictions_df.to_csv(os.path.join(MODEL_DIR, f"{name.replace(' ', '_')}_predictions.csv"), index=False)
    
    if results:
        best_model_name = max(results, key=lambda k: results[k]["f1_score"])
        best_model = models[best_model_name]
        
        print(f"\nBest model: {best_model_name}")
        print(f"F1 Score: {results[best_model_name]['f1_score']:.4f}")
        
        with open(os.path.join(MODEL_DIR, "best_model.pkl"), 'wb') as f:
            pickle.dump(best_model, f)
        
        if len(non_graduated_features) > 0:
            best_predictions_df = pd.read_csv(os.path.join(MODEL_DIR, f"{best_model_name.replace(' ', '_')}_predictions.csv"))
            best_predictions_df.to_csv(os.path.join(MODEL_DIR, "final_predictions.csv"), index=False)
            
            results["best_model"] = best_model_name
            results["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            results["num_graduated_samples"] = len(y_train) + len(y_test)
            results["num_non_graduated_samples"] = len(non_graduated_features)
            
            with open(os.path.join(MODEL_DIR, "model_evaluation.json"), 'w') as f:
                json.dump(results, f, indent=4)
            
            return best_model, results, best_predictions_df
        else:
            return best_model, results, None
    else:
        return None, None, None

if __name__ == "__main__":
    print("Starting ML model training and evaluation with feature debugging...")
    best_model, results, predictions = train_and_evaluate_models()
    
    if best_model is not None:
        print("\nTraining and evaluation complete!")
        print(f"All model files and predictions saved to: {MODEL_DIR}")
        
        if predictions is not None and not predictions.empty:
            print("\nSample predictions for non-graduated students:")
            print(predictions.head())
        
        if results is not None and 'best_model' in results:
            print(f"\nBest model: {results['best_model']}")
            print(f"Best model accuracy: {results[results['best_model']]['accuracy']:.4f}")
            print(f"Best model F1 score: {results[results['best_model']]['f1_score']:.4f}")
    else:
        print("\nModel training failed.")