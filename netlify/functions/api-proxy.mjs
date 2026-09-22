export default async (request) => {
  const origin=(process.env.AMANI_BACKEND_ORIGIN||'').replace(/\/+$/,'');
  const key=process.env.ADMIN_API_KEY||'';
  if(!origin || !key) return new Response(JSON.stringify({success:false,error:'Admin proxy is not configured'}),{status:503,headers:{'content-type':'application/json'}});
  const url=new URL(request.url);
  const proxiedPath=url.searchParams.get('path');
  const targetPath=proxiedPath === '__health__' ? '/health' : `/api/${proxiedPath || ''}`;
  url.searchParams.delete('path');
  const target=origin+targetPath+(url.searchParams.size ? `?${url.searchParams}` : '');
  const headers=new Headers(request.headers);
  headers.set('x-admin-api-key',key); headers.delete('host'); headers.delete('cookie');
  const init={method:request.method,headers,redirect:'manual'};
  if(!['GET','HEAD'].includes(request.method)) init.body=await request.arrayBuffer();
  const upstream=await fetch(target,init);
  const outHeaders=new Headers(upstream.headers); outHeaders.delete('set-cookie');
  return new Response(upstream.body,{status:upstream.status,headers:outHeaders});
};