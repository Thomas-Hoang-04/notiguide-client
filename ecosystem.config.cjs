module.exports = {
  apps: [
    {
      name: "notiguide-client",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
