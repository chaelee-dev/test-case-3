import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[conduit] backend listening on :${port}`);
});
