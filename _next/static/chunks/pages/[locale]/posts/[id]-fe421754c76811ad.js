(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[416],{47941:(e,t,n)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/posts/[id]",function(){return n(80038)}])},92285:(e,t,n)=>{"use strict";n.d(t,{Z:()=>r});var l=n(85893),s=n(25675),c=n.n(s);function r(e){let{src:t,alt:n,width:s=800,height:r=600,className:i="",priority:a=!0}=e;return(0,l.jsx)("div",{className:"image-wrapper text-center mb-4 ".concat(i),children:(0,l.jsx)(c(),{src:t,alt:n,className:"img-fluid rounded",width:s,height:r,style:{width:"100%",height:"auto"},priority:a})})}},80038:(e,t,n)=>{"use strict";n.r(t),n.d(t,{__N_SSG:()=>B,default:()=>K});var l=n(85893),s=n(67294),c=n(9008),r=n.n(c),i=n(97375),a=n(53280),o=n(70270),d=n(97143),m=n(92285),u=n(41664),h=n.n(u),x=n(72510),p=n(4958),j=n(10798),g=n(88287),N=n(70517),y=n(48352),v=n(93179),b=n(84283),f=n(73190),k=n(46350),Z=n(76720),w=n(67814);let _=e=>{let{inline:t,className:n,children:c,theme:r,t:i,...a}=e,[o,d]=(0,s.useState)(!1),m="dark"===r?b.m4:b.$E,u=/language-(\w+)/.exec(null!=n?n:"");return t?(0,l.jsx)("code",{className:n,...a,children:c}):u?(0,l.jsxs)("div",{className:"code-block-container",children:[(0,l.jsx)(v.Z,{style:m,language:u[1],PreTag:"div",...a,children:String(c).replace(/\n$/,"")}),(0,l.jsx)(f.Z,{placement:"top",overlay:(0,l.jsx)(k.Z,{id:"copy-tooltip",children:i(o?"common.codeBlock.copied":"common.codeBlock.copy")}),children:(0,l.jsx)(Z.Z,{className:"copy-button",size:"sm",onClick:()=>{c&&(navigator.clipboard.writeText(String(c)),d(!0),setTimeout(()=>d(!1),2e3))},children:(0,l.jsx)(w.G,{icon:o?"check":"copy",className:"me-2 fa-icon"})})})]}):(0,l.jsx)("code",{className:n,...a,children:c})};var P=n(59037),E=n(1463),G=n(49770);let S=e=>e.split("@tab").slice(1).map((e,t)=>{var n,l;let[s,...c]=e.trim().split("\n"),r=/^([a-zA-Z0-9\s]+?)(?:\s+\[icon=([a-zA-Z0-9_-]+)])?$/.exec(s),i=null!==(l=null==r?void 0:null===(n=r[1])||void 0===n?void 0:n.trim())&&void 0!==l?l:"",a=null==r?void 0:r[2];return{key:"tab-".concat(t),title:i,content:c.join("\n").trim(),iconName:a}}),T=s.memo(e=>{var t,n;let{content:c,components:r}=e,i=(0,s.useMemo)(()=>S(c),[c]);return(0,l.jsx)(P.Z,{defaultActiveKey:null!==(n=null===(t=i[0])||void 0===t?void 0:t.key)&&void 0!==n?n:"tab-0",className:"mb-3",children:i.map(e=>{let t=e.iconName?G.gP[e.iconName]:null;return(0,l.jsx)(E.Z,{eventKey:e.key,title:(0,l.jsxs)("span",{style:{display:"flex",alignItems:"center"},children:[t&&(0,l.jsx)(t,{style:{height:"20px",marginRight:"8px"}}),e.title]}),children:(0,l.jsx)(x.U,{remarkPlugins:[p.Z],rehypePlugins:[j.Z],components:r,children:e.content})},e.key)})})});T.displayName="MarkdownTabsRenderer";let C=e=>[...e.split(/:::tabs([\s\S]*?):::/gm)].reduce((e,t,n)=>{let l=n%2==0?"markdown":"tabs";return t.trim()&&e.push({id:"".concat(l,"-").concat(n),type:l,content:t.trim()}),e},[]),$=(e,t)=>({code:n=>{let{inline:s,className:c,children:r,...i}=n;return(0,l.jsx)(_,{inline:s,className:c,theme:e,t:t,...i,children:r})},table:e=>{let{children:t}=e;return(0,l.jsx)(g.Z,{striped:!0,bordered:!0,children:t})},th:e=>{let{children:t}=e;return(0,l.jsx)("th",{children:t})},td:e=>{let{children:t}=e;return(0,l.jsx)("td",{children:t})},ul:e=>{let{children:t}=e;return(0,l.jsx)("ul",{className:"list-group list-group-flush",children:t})},ol:e=>{let{children:t}=e;return(0,l.jsx)("ol",{className:"list-group list-group-numbered",children:t})},li:e=>{let{children:t}=e;return(0,l.jsx)("li",{className:"list-group-item",children:t})},a:e=>{let{href:t,children:n}=e;return(0,l.jsx)("a",{href:t,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none text-primary",children:n})}}),z=e=>{let{content:t}=e,{t:n}=(0,y.$G)("common"),c=(0,N.CG)(e=>e.theme.theme),r=(0,s.useMemo)(()=>$(c,n),[c,n]),i=C(t);return(0,l.jsx)(l.Fragment,{children:i.map(e=>"tabs"===e.type?(0,l.jsx)(T,{content:e.content,components:r},e.id):(0,l.jsx)(x.U,{remarkPlugins:[p.Z],rehypePlugins:[j.Z],components:r,children:e.content},e.id))})};function A(e){let{post:t}=e,{title:n,date:s,contentHtml:c,thumbnail:r,topics:u,readingTime:x}=t;return(0,l.jsxs)(i.Z,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,l.jsx)("h1",{className:"fw-bold display-4 text-center mb-4",children:n}),(0,l.jsxs)("p",{className:"text-center d-flex justify-content-center align-items-center text-muted mb-4",children:[(0,l.jsxs)("span",{className:"d-flex align-items-center me-3",children:[(0,l.jsx)(w.G,{icon:"calendar-alt",className:"me-2"}),(0,l.jsx)(d.Z,{date:s})]}),(0,l.jsxs)("span",{className:"d-flex align-items-center",children:[(0,l.jsx)(w.G,{icon:"clock",className:"me-2"}),x]})]}),u&&u.length>0&&(0,l.jsx)("div",{className:"mb-4 d-flex justify-content-center flex-wrap",children:u.map(e=>(0,l.jsx)(h(),{href:"/topics/".concat(e.id),children:(0,l.jsx)(a.Z,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),r&&(0,l.jsx)(m.Z,{src:"".concat(o.Vc).concat(r),alt:n,width:800,height:600}),(0,l.jsx)("article",{className:"fs-5 lh-lg",children:(0,l.jsx)(z,{content:null!=c?c:""})})]})}var M=n(87861),B=!0;function K(e){var t;let{post:n}=e,s=(null!==(t=n.topics)&&void 0!==t?t:[]).map(e=>e.name).join(", ");return(0,l.jsxs)(M.Z,{children:[(0,l.jsxs)(r(),{children:[(0,l.jsx)("title",{children:n.title}),(0,l.jsx)("meta",{name:"description",content:n.summary}),(0,l.jsx)("meta",{name:"keywords",content:s}),(0,l.jsx)("meta",{name:"author",content:o.x1})]}),(0,l.jsx)(A,{post:n})]})}}},e=>{var t=t=>e(e.s=t);e.O(0,[789,806,861,888,774,179],()=>t(47941)),_N_E=e.O()}]);