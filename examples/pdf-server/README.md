# PDF server example
This is a simple example of running a server using thart in cluster mode with 4 workers.

The server reads a PDF file and returns the text content of the first page.

Get started:
```bash
npm i  # or pnpm/yarn if you prefer
npm start
```

You should see four workers start up:
```
Worker 0 running with pid XXXX
Worker 1 running with pid XXXX
Worker 3 running with pid XXXX
Worker 2 running with pid XXXX
```

Next, make a request using curl (or any http client you prefer):
```bash
curl -X POST -H "Content-Type: application/pdf" --data-binary @document.pdf http://localhost:3000/
```

The worker handling the request will log its pid and respond with something like:
```json
{
  "text": "This is the text content of the first page."
}
```
