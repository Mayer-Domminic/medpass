# MEDPASS - Predictive Assessment for Student Success 🎓

## Overview
MEDPASS is a predictive analytics platform designed to assess and enhance student success in medical education. The system leverages data-driven insights to identify early intervention opportunities and support academic achievement through NetID authentication and comprehensive student performance tracking.

### Deployment URLs
- **API:** [api.medpass.unr.dev](https://api.medpass.unr.dev)
- **Web:** [medpass.unr.dev](https://medpass.unr.dev)


python3 -m venv venv
. venv/bin/activate
source backend/venv/bin/activate


python -m app.scripts.tables.printer
python -m app.scripts.init_db

docker compose up --build






### PostgreSQL Setup
```bash
sudo -u postgres psql

CREATE DATABASE medpass;
CREATE USER medpassadmin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE medpass TO medpassadmin;

\c medpass
GRANT ALL ON SCHEMA public TO medpassadmin;
\q
```





### Docker Compose Checks:
docker-compose exec postgres psql -U medpassadmin -d medpass -c "\dt"
docker-compose exec postgres psql -U medpassadmin -d medpass -c "ALTER USER medpassadmin WITH PASSWORD 'password';"
docker exec -ti medpass-postgres psql -d medpass -U medpassadmin
docker-compose up -d
docker-compose down

