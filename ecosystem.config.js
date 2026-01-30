module.exports = {
  apps: [
    {
      name: 'allergy-scribe',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/user/allergy-scribe',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}