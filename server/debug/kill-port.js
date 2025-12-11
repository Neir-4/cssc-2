import { exec } from 'child_process';

const port = process.env.PORT || 5000;

console.log(`🔍 Checking for processes on port ${port}...`);

exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
  if (stdout) {
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        pids.add(parts[4]);
      }
    });
    
    pids.forEach(pid => {
      console.log(`🔪 Killing process ${pid}...`);
      exec(`taskkill /PID ${pid} /F`, (killError, killStdout) => {
        if (killError) {
          console.log(`❌ Failed to kill ${pid}: ${killError.message}`);
        } else {
          console.log(`✅ Killed process ${pid}`);
        }
      });
    });
  } else {
    console.log(`✅ Port ${port} is free`);
  }
});