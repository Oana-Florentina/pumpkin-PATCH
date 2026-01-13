const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'https://d3pnfxsee44y6e.cloudfront.net', 'http://phoa-frontend-1768271733.s3-website-us-east-1.amazonaws.com'],
  credentials: true
}));
app.use(express.json());

app.use('/api/phobias', require('./routes/phobias'));
app.use('/api/users', require('./routes/users'));
app.use('/api/context', require('./routes/context'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/shacl', require('./routes/shacl'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
