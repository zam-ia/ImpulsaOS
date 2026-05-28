async function run() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/cron/daily`, {
    headers: process.env.CRON_SECRET ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : undefined
  });

  const result = await response.json();
  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
