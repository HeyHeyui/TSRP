
import express from 'express';

const app = express();

app.all('/', (req, res) => {
  res.send('✅ Bot is alive!');
});

export function keep_alive() {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🌐 Keep-alive server is running on port ${PORT}`);
  });
}
