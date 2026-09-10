export function GET() {
  const csv = [
    "companyName,contactName,phone,email,seats,city,microMarket,type,budget,timeline,source,industry,notes",
    "Acme Corp,Riya Sharma,+919000000001,riya@acme.com,50-100,Hyderabad,HITEC City,MANAGED_OFFICE,8000,1_month,REFERRAL,IT / Software,Prefers furnished",
    "Globex,Arjun Rao,+919000000002,,20-50,Bangalore,Koramangala,COWORKING,7000,immediate,LINKEDIN,Fintech,",
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="enquiry-import-template.csv"',
    },
  });
}
