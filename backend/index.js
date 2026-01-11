const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/phobias', require('./routes/phobias'));
app.use('/api/users', require('./routes/users'));
app.use('/api/context', require('./routes/context'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
