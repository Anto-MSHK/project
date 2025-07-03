import createError from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { addItem, getItems, deleteItem } from './db';
import * as path from 'path';
import { homedir } from 'os';
import * as fs from 'fs';
import { createStaticPanelsRouter } from './routes/static-panels';
import { ModuleManager } from './managers/ModulesManager';
import { createModuleDataRouter } from './routes/module-data';
import { createFileSystemRouter } from './routes/filesystem';

// Define the www directory path
const wwwDir = path.join(homedir(), '.aicombiner', 'www');

// Create the directory if it doesn't exist
try {
  if (!fs.existsSync(wwwDir)) {
    fs.mkdirSync(wwwDir, { recursive: true });
  }
} catch (error) {
  console.error('Error creating www directory:', error);
}


export async function createApp(
): Promise<express.Application> {

const app = express();
const modulesManager = new ModuleManager();
modulesManager.initialize();

app.use(logger('dev'));
// Configure CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.startsWith('http://localhost') || origin.startsWith('chrome://ai-combiner'))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from ~/.aicombiner/www/
// app.use('/www', express.static(wwwDir));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({});
});


app.use("/", createStaticPanelsRouter(modulesManager));

// Add an item
app.post('/items', async (req: Request, res: Response) => {
  try {
    const { name, url } = req.body;
    const _id = await addItem(name, url);
    res.status(201).json({ _id, name, url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Get all items
app.get('/items', async (req: Request, res: Response) => {
  try {
    const items = await getItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

app.delete('/items', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    console.log("id", id);
    const n = await deleteItem(id);
    res.status(201).json({ id, "success": n > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

app.use("/api/fs", createFileSystemRouter(modulesManager));
// Add router registrations BEFORE the fallback handlers
app.use("/api/db", createModuleDataRouter(modulesManager));

// catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

return app;
}