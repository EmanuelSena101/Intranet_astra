export async function GET() {
  return Response.json({
    status: "ok",
    service: "web",
    utc: new Date().toISOString()
  });
}

