import argparse
from ..core.database import create_table, drop_table

def manage_tables(option):
    if option == 'create':
        create_table()
    elif option == 'drop':
        drop_table()
    elif option == 'reset':
        drop_table()
        create_table()
        
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('option', choices=['create', 'drop', 'reset'],
                        help= 'Choice table manage option [Create, Drop, or Reset]')
    
    args = parser.parse_args()
    manage_tables(args.option)
    
                        
        