const user = process.env.GH_USER;
const query = `query($login:String!){user(login:$login){contributionsCollection{
  contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${process.env.GH_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables: { login: user } }),
});
const json = await res.json();
if (!json.data?.user) throw new Error(JSON.stringify(json.errors ?? json));

const days = json.data.user.contributionsCollection.contributionCalendar.weeks
  .flatMap(w => w.contributionDays).slice(-31);

const W = 900, H = 300, P = 40;
const max = Math.max(1, ...days.map(d => d.contributionCount));
const x = i => P + (i * (W - 2 * P)) / (days.length - 1);
const y = v => H - P - (v * (H - 2 * P)) / max;
const pts = days.map((d, i) => `${x(i)},${y(d.contributionCount)}`).join(" ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="100%" height="100%" rx="8" fill="#1a1b27"/>
<text x="${W / 2}" y="24" text-anchor="middle" fill="#70a5fd" font-family="sans-serif" font-size="16">${user}'s Contribution Graph</text>
<polygon points="${x(0)},${H - P} ${pts} ${x(days.length - 1)},${H - P}" fill="#bf91f3" opacity="0.15"/>
<polyline points="${pts}" fill="none" stroke="#bf91f3" stroke-width="2"/>
${days.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.contributionCount)}" r="3" fill="#38bdae"><title>${d.date}: ${d.contributionCount}</title></circle>`).join("")}
</svg>`;

(await import("node:fs")).writeFileSync("activity-graph.svg", svg);
