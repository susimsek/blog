(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[416],{47941:(e,t,n)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/posts/[id]",function(){return n(80038)}])},97143:(e,t,n)=>{"use strict";n.d(t,{Z:()=>i});var l=n(85893);n(67294);var r=n(11163),s=n(34421),c=n.n(s);function i(e){var t;let{date:n,locale:s}=e,i=(0,r.useRouter)(),a=null!==(t=null!=s?s:i.query.locale)&&void 0!==t?t:c().i18n.defaultLocale;return(0,l.jsx)("span",{children:new Date(n).toLocaleDateString(a,{year:"numeric",month:"long",day:"numeric"})})}},92285:(e,t,n)=>{"use strict";n.d(t,{Z:()=>c});var l=n(85893),r=n(25675),s=n.n(r);function c(e){let{src:t,alt:n,width:r=800,height:c=600,className:i="",priority:a=!0}=e;return(0,l.jsx)("div",{className:"text-center mb-4 ".concat(i),children:(0,l.jsx)(s(),{src:t,alt:n,className:"img-fluid rounded",width:r,height:c,style:{width:"100%",height:"auto"},priority:a})})}},80038:(e,t,n)=>{"use strict";n.r(t),n.d(t,{__N_SSG:()=>L,default:()=>U});var l=n(85893),r=n(67294),s=n(9008),c=n.n(s),i=n(97375),a=n(53280),o=n(70270),d=n(97143),m=n(92285),u=n(41664),h=n.n(u),x=n(72510),p=n(4958),j=n(10798),g=n(88287),v=n(70517),y=n(48352),N=n(93179),b=n(84283),f=n(73190),k=n(46350),Z=n(76720),_=n(67814);let w=e=>{let{inline:t,className:n,children:s,theme:c,t:i,...a}=e,[o,d]=(0,r.useState)(!1),m="dark"===c?b.m4:b.$E,u=/language-(\w+)/.exec(null!=n?n:"");return t?(0,l.jsx)("code",{className:n,...a,children:s}):u?(0,l.jsxs)("div",{className:"code-block-container",children:[(0,l.jsx)(N.Z,{style:m,language:u[1],PreTag:"div",...a,children:String(s).replace(/\n$/,"")}),(0,l.jsx)(f.Z,{placement:"top",overlay:(0,l.jsx)(k.Z,{id:"copy-tooltip",children:i(o?"common.codeBlock.copied":"common.codeBlock.copy")}),children:(0,l.jsx)(Z.Z,{className:"copy-button",size:"sm",onClick:()=>{s&&(navigator.clipboard.writeText(String(s)),d(!0),setTimeout(()=>d(!1),2e3))},children:(0,l.jsx)(_.G,{icon:o?"check":"copy",className:"me-2 fa-icon"})})})]}):(0,l.jsx)("code",{className:n,...a,children:s})};var S=n(59037),E=n(1463);let P=e=>e.split("@tab").slice(1).map((e,t)=>{var n,l;let[r,...s]=e.trim().split("\n"),c=/^([a-zA-Z0-9\s]+?)(?:\s+\[icon=([a-zA-Z0-9_-]+)])?$/.exec(r),i=null!==(l=null==c?void 0:null===(n=c[1])||void 0===n?void 0:n.trim())&&void 0!==l?l:"",a=null==c?void 0:c[2];return{key:"tab-".concat(t),title:i,content:s.join("\n").trim(),iconName:a}}),C=e=>{var t,s;let{content:c,components:i}=e,a=P(c),o=e=>r.lazy(()=>n(62873)("./".concat(e,".svg")).then(e=>({default:e.ReactComponent})));return(0,l.jsx)(S.Z,{defaultActiveKey:null!==(s=null===(t=a[0])||void 0===t?void 0:t.key)&&void 0!==s?s:"tab-0",className:"mb-3",children:a.map(e=>{let t=e.iconName?o(e.iconName):null;return(0,l.jsx)(E.Z,{eventKey:e.key,title:(0,l.jsxs)("span",{style:{display:"flex",alignItems:"center"},children:[t&&(0,l.jsx)(r.Suspense,{fallback:(0,l.jsx)("span",{children:"Loading..."}),children:(0,l.jsx)(t,{style:{height:"20px",marginRight:"8px"}})}),e.title]}),children:(0,l.jsx)(x.U,{remarkPlugins:[p.Z],rehypePlugins:[j.Z],components:i,children:e.content})},e.key)})})},O=e=>[...e.split(/:::tabs([\s\S]*?):::/gm)].reduce((e,t,n)=>{let l=n%2==0?"markdown":"tabs";return t.trim()&&e.push({id:"".concat(l,"-").concat(n),type:l,content:t.trim()}),e},[]),T=(e,t)=>({code:n=>{let{inline:r,className:s,children:c,...i}=n;return(0,l.jsx)(w,{inline:r,className:s,theme:e,t:t,...i,children:c})},table:e=>{let{children:t}=e;return(0,l.jsx)(g.Z,{striped:!0,bordered:!0,children:t})},th:e=>{let{children:t}=e;return(0,l.jsx)("th",{children:t})},td:e=>{let{children:t}=e;return(0,l.jsx)("td",{children:t})},ul:e=>{let{children:t}=e;return(0,l.jsx)("ul",{className:"list-group list-group-flush",children:t})},ol:e=>{let{children:t}=e;return(0,l.jsx)("ol",{className:"list-group list-group-numbered",children:t})},li:e=>{let{children:t}=e;return(0,l.jsx)("li",{className:"list-group-item",children:t})},a:e=>{let{href:t,children:n}=e;return(0,l.jsx)("a",{href:t,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none text-primary",children:n})}}),z=e=>{let{content:t}=e,{t:n}=(0,y.$G)("common"),s=(0,v.CG)(e=>e.theme.theme),c=(0,r.useMemo)(()=>T(s,n),[s,n]),i=O(t);return(0,l.jsx)(l.Fragment,{children:i.map(e=>"tabs"===e.type?(0,l.jsx)(C,{content:e.content,components:c},e.id):(0,l.jsx)(x.U,{remarkPlugins:[p.Z],rehypePlugins:[j.Z],components:c,children:e.content},e.id))})};function D(e){let{post:t}=e,{title:n,date:r,contentHtml:s,thumbnail:c,topics:u}=t;return(0,l.jsxs)(i.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,l.jsx)("h1",{className:"fw-bold display-4 text-center mb-4",children:n}),(0,l.jsx)("p",{className:"text-muted text-center mb-4",style:{fontSize:"1.1rem"},children:(0,l.jsx)(d.Z,{date:r})}),u&&u.length>0&&(0,l.jsx)("div",{className:"mb-4",children:u.map(e=>(0,l.jsx)(h(),{href:"/topics/".concat(e.id),children:(0,l.jsx)(a.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),c&&(0,l.jsx)(m.Z,{src:"".concat(o.Vc).concat(c),alt:n,width:800,height:600}),(0,l.jsx)("article",{className:"fs-5 lh-lg",children:(0,l.jsx)(z,{content:null!=s?s:""})})]})}var G=n(92098),L=!0;function U(e){var t;let{post:n}=e,r=(null!==(t=n.topics)&&void 0!==t?t:[]).map(e=>e.name).join(", ");return(0,l.jsxs)(G.Z,{children:[(0,l.jsxs)(c(),{children:[(0,l.jsx)("title",{children:n.title}),(0,l.jsx)("meta",{name:"description",content:n.summary}),(0,l.jsx)("meta",{name:"keywords",content:r}),(0,l.jsx)("meta",{name:"author",content:o.x1})]}),(0,l.jsx)(D,{post:n})]})}},62873:(e,t,n)=>{var l={"./java.svg":[86922,922],"./kotlin.svg":[75840,840]};function r(e){if(!n.o(l,e))return Promise.resolve().then(()=>{var t=Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t});var t=l[e],r=t[0];return n.e(t[1]).then(()=>n(r))}r.keys=()=>Object.keys(l),r.id=62873,e.exports=r}},e=>{var t=t=>e(e.s=t);e.O(0,[557,808,806,98,888,774,179],()=>t(47941)),_N_E=e.O()}]);