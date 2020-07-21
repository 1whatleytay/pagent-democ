const http = require('http')
const cp = require('child_process')

async function compile(source) {
  return new Promise((resolve) => {
    const compiler = cp.spawn('exec/page', ['debug', 'stdin'])

    const session = {
      content: ''
    }

    compiler.stdin.write((source.length + 1).toString() + '\n')
    compiler.stdin.write(source + '\n\n')
    compiler.stdin.end()

    compiler.stdout.on('data', data => {
      session.content += data
    })

    compiler.on('close', () => {
      resolve(session)
    })
  })
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080')
  res.setHeader('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')

  if (req.url === '/compile') {
    let body = []

    req.on('data', (chunk) => {
      body.push(chunk)
    })

    req.on('end', async () => {
      if (!body.length) {
        res.statusCode = 200
        res.end('No source.')

        return
      }

      const source = Buffer.concat(body).toString()

      compile(source).then((app) => {
        res.statusCode = 200

        if (app.content.startsWith('\nfunction print(x)')) {
          res.end(JSON.stringify({ content: app.content }))
        } else {
          res.end(JSON.stringify({ error: app.content }))
        }
      })
    })
  } else {
    res.statusCode = 200
    res.end()
  }
})

server.listen(3000, '127.0.0.1', () => {
  console.log('Server Started')
})
