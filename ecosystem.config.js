module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: 'uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8000 --reload',
      interpreter: 'python3',
      env: {
        PYTHONUNBUFFERED: '1'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      time: true
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      // args: 'run dev -- --host 0.0.0.0',
      env: {
        NODE_ENV: 'development'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      time: true
    }
  ]
};
