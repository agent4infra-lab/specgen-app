import { Fragment } from 'react';
const pattern=/(\/\/.*$|"[^"]*"|\b(?:constexpr|int|float4|float|void|const|if|for|return|__global__|__shared__|__restrict__|__syncthreads|fmaf|fmaxf)\b|\b\d+(?:\.\d+)?f?\b)/g;
export function CodeView({code}:{code:string}){
 return <pre className="source-code"><code>{code.split('\n').map((line,i)=><span className="source-line" key={i}><span className="line-number">{i+1}</span><span>{line.split(pattern).map((token,j)=><Fragment key={j}>{token.startsWith('//')?<span className="token-comment">{token}</span>:/^(?:constexpr|int|float4|float|void|const|if|for|return|__global__|__shared__|__restrict__|__syncthreads|fmaf|fmaxf|\d)/.test(token)?<span className={/^\d/.test(token)?'token-number':'token-keyword'}>{token}</span>:token}</Fragment>)}</span></span>)}</code></pre>;
}
