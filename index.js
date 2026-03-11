const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());

app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});