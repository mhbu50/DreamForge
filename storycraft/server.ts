import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/codebase', async (req, res) => {
    try {
      const getFiles = async (dir: string): Promise<string[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(entries.map((entry) => {
          const res = path.resolve(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') return [];
            return getFiles(res);
          }
          return res;
        }));
        return Array.prototype.concat(...files);
      };

      const rootDir = process.cwd();
      const allFiles = await getFiles(rootDir);
      const relativeFiles = allFiles.map(f => path.relative(rootDir, f));
      
      res.json({ files: relativeFiles });
    } catch (error) {
      res.status(500).json({ error: 'Failed to read codebase' });
    }
  });

  app.get('/api/file', async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: 'Path is required' });

    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      // Security check: ensure path is within project root
      if (!fullPath.startsWith(process.cwd())) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      res.json({ content });
    } catch (error) {
      res.status(500).json({ error: 'Failed to read file' });
    }
  });
  
  app.get('/api/search', async (req, res) => {
    const pattern = req.query.pattern as string;
    if (!pattern) return res.status(400).json({ error: 'Pattern is required' });
    
    try {
      // Use grep to search for the pattern
      // -r: recursive, -n: line number, -I: ignore binary files, -E: extended regex
      const { stdout } = await execAsync(`grep -rnIE "${pattern.replace(/"/g, '\\"')}" . --exclude-dir={node_modules,dist,.git}`);
      res.json({ results: stdout });
    } catch (error: any) {
      // grep returns exit code 1 if no matches found, which execAsync treats as an error
      if (error.code === 1) {
        return res.json({ results: "" });
      }
      res.status(500).json({ error: 'Failed to search codebase' });
    }
  });

  app.post('/api/fix', async (req, res) => {
    const { targetFile, code } = req.body;
    if (!targetFile || !code) return res.status(400).json({ error: 'Target file and code are required' });

    try {
      const fullPath = path.resolve(process.cwd(), targetFile);
      if (!fullPath.startsWith(process.cwd())) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await fs.writeFile(fullPath, code, 'utf-8');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to apply fix' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
