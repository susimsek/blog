(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[776],{17237:(e,t,n)=>{"use strict";n.d(t,{A:()=>l});var a=n(37876),s=n(54587),r=n.n(s);function l(e){let{src:t,alt:n,width:s=800,height:l=600,className:c="",priority:i=!0}=e;return(0,a.jsx)("div",{className:"image-wrapper text-center mb-4 ".concat(c),children:(0,a.jsx)(r(),{src:t,alt:n,className:"img-fluid rounded",width:s,height:l,style:{width:"100%",height:"auto"},priority:i})})}},55692:(e,t,n)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/posts/[id]",function(){return n(62316)}])},62316:(e,t,n)=>{"use strict";n.r(t),n.d(t,{__N_SSG:()=>$,default:()=>G});var a=n(37876),s=n(14232),r=n(77328),l=n.n(r),c=n(77478),i=n(22662),o=n(59414),m=n(87747),d=n(17237),p=n(48230),x=n.n(p),u=n(24948),h=n(87979),j=n(65862),g=n(93925),y=n(52074),N=n(95429),b=n(19482),f=n(80825),v=n(96244),w=n(74510),_=n(64231),A=n(97460);let k=e=>{let{inline:t,className:n,children:r,theme:l,t:c,...i}=e,[o,m]=(0,s.useState)(!1),d="dark"===l?f.EP:f.UT,p=/language-(\w+)/.exec(null!=n?n:"");return t?(0,a.jsx)("code",{className:n,...i,children:r}):p?(0,a.jsxs)("div",{className:"code-block-container",children:[(0,a.jsx)(b.A,{style:d,language:p[1],PreTag:"div",...i,children:String(r).replace(/\n$/,"")}),(0,a.jsx)(v.A,{placement:"top",overlay:(0,a.jsx)(w.A,{id:"copy-tooltip",children:c(o?"common.codeBlock.copied":"common.codeBlock.copy")}),children:(0,a.jsx)(_.A,{className:"copy-button",size:"sm",onClick:()=>{r&&(navigator.clipboard.writeText(String(r)),m(!0),setTimeout(()=>m(!1),2e3))},children:(0,a.jsx)(A.g,{icon:o?"check":"copy",className:"me-2 fa-icon"})})})]}):(0,a.jsx)("code",{className:n,...i,children:r})};var P=n(3331),T=n(78145),S=n(61322);let E=e=>e.split("@tab").slice(1).map((e,t)=>{var n,a;let[s,...r]=e.trim().split("\n"),l=/^([a-zA-Z0-9\s]+?)(?:\s+\[icon=([a-zA-Z0-9_-]+)])?$/.exec(s),c=null!==(a=null==l?void 0:null===(n=l[1])||void 0===n?void 0:n.trim())&&void 0!==a?a:"",i=null==l?void 0:l[2];return{key:"tab-".concat(t),title:c,content:r.join("\n").trim(),iconName:i}}),z=s.memo(e=>{var t,n;let{content:r,components:l}=e,c=(0,s.useMemo)(()=>E(r),[r]);return(0,a.jsx)(P.A,{defaultActiveKey:null!==(n=null===(t=c[0])||void 0===t?void 0:t.key)&&void 0!==n?n:"tab-0",className:"mb-3",children:c.map(e=>{let t=e.iconName?S.y4[e.iconName]:null;return(0,a.jsx)(T.A,{eventKey:e.key,title:(0,a.jsxs)("span",{style:{display:"flex",alignItems:"center"},children:[t&&(0,a.jsx)(t,{style:{height:"20px",marginRight:"8px"}}),e.title]}),children:(0,a.jsx)(u.oz,{remarkPlugins:[h.A],rehypePlugins:[j.A],components:l,children:e.content})},e.key)})})});z.displayName="MarkdownTabsRenderer";let B=e=>[...e.split(/:::tabs([\s\S]*?):::/gm)].reduce((e,t,n)=>{let a=n%2==0?"markdown":"tabs";return t.trim()&&e.push({id:"".concat(a,"-").concat(n),type:a,content:t.trim()}),e},[]),M=(e,t)=>({code:n=>{let{inline:s,className:r,children:l,...c}=n;return(0,a.jsx)(k,{inline:s,className:r,theme:e,t:t,...c,children:l})},table:e=>{let{children:t}=e;return(0,a.jsx)(g.A,{striped:!0,bordered:!0,children:t})},th:e=>{let{children:t}=e;return(0,a.jsx)("th",{children:t})},td:e=>{let{children:t}=e;return(0,a.jsx)("td",{children:t})},ul:e=>{let{children:t}=e;return(0,a.jsx)("ul",{className:"list-group list-group-flush",children:t})},ol:e=>{let{children:t}=e;return(0,a.jsx)("ol",{className:"list-group list-group-numbered",children:t})},li:e=>{let{children:t}=e;return(0,a.jsx)("li",{className:"list-group-item",children:t})},a:e=>{let{href:t,children:n}=e;return(0,a.jsx)("a",{href:t,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none text-primary",children:n})}}),W=e=>{let{content:t}=e,{t:n}=(0,N.Bd)("common"),r=(0,y.GV)(e=>e.theme.theme),l=(0,s.useMemo)(()=>M(r,n),[r,n]),c=B(t);return(0,a.jsx)(a.Fragment,{children:c.map(e=>"tabs"===e.type?(0,a.jsx)(z,{content:e.content,components:l},e.id):(0,a.jsx)(u.oz,{remarkPlugins:[h.A],rehypePlugins:[j.A],components:l,children:e.content},e.id))})};function C(e){let{post:t}=e,{title:n,date:s,contentHtml:r,thumbnail:l,topics:p,readingTime:u}=t;return(0,a.jsxs)(c.A,{className:"mt-5",style:{maxWidth:"800px"},children:[(0,a.jsx)("h1",{className:"fw-bold display-4 text-center mb-4",children:n}),(0,a.jsxs)("p",{className:"text-center d-flex justify-content-center align-items-center text-muted mb-4",children:[(0,a.jsxs)("span",{className:"d-flex align-items-center me-3",children:[(0,a.jsx)(A.g,{icon:"calendar-alt",className:"me-2"}),(0,a.jsx)(m.A,{date:s})]}),(0,a.jsxs)("span",{className:"d-flex align-items-center",children:[(0,a.jsx)(A.g,{icon:"clock",className:"me-2"}),u]})]}),p&&p.length>0&&(0,a.jsx)("div",{className:"mb-4 d-flex justify-content-center flex-wrap",children:p.map(e=>(0,a.jsx)(x(),{href:"/topics/".concat(e.id),children:(0,a.jsx)(i.A,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))}),l&&(0,a.jsx)(d.A,{src:"".concat(o.J$).concat(l),alt:n,width:800,height:600}),(0,a.jsx)("article",{className:"fs-5 lh-lg",children:(0,a.jsx)(W,{content:null!=r?r:""})})]})}var L=n(16268),O=n(89099),R=n(45428),Z=n.n(R),$=!0;function G(e){var t,n,s;let{post:r,posts:c}=e,i=(0,O.useRouter)(),{t:m}=(0,N.Bd)("post"),d=i.query.locale||Z().i18n.defaultLocale,p=(null!==(n=r.topics)&&void 0!==n?n:[]).map(e=>e.name).join(", "),x="".concat(o.W6,"/posts/").concat(r.id),u="".concat(o.W6,"/").concat(d,"/posts/").concat(r.id),h="".concat(o.W6).concat(r.thumbnail),j={"@context":"https://schema.org","@type":"BlogPosting",headline:r.title,description:r.summary,image:h,author:{"@type":"Person",name:o.A5},datePublished:r.date,url:u};return(0,a.jsxs)(L.A,{posts:c,searchEnabled:!0,children:[(0,a.jsxs)(l(),{children:[(0,a.jsx)("title",{children:r.title}),(0,a.jsx)("meta",{name:"description",content:r.summary}),(0,a.jsx)("link",{rel:"canonical",href:x}),(0,a.jsx)("meta",{name:"keywords",content:p}),(0,a.jsx)("meta",{name:"author",content:o.A5}),(0,a.jsx)("meta",{name:"robots",content:"index, follow, max-image-preview:large, max-snippet:-1"}),(0,a.jsx)("meta",{property:"og:title",content:r.title}),(0,a.jsx)("meta",{property:"og:description",content:r.summary}),(0,a.jsx)("meta",{property:"og:type",content:"article"}),(0,a.jsx)("meta",{property:"og:url",content:u}),(0,a.jsx)("meta",{property:"og:site_name",content:m("common:common.siteName")}),(0,a.jsx)("meta",{property:"og:image",content:h}),(0,a.jsx)("meta",{property:"og:image:type",content:"image/jpeg"}),(0,a.jsx)("meta",{property:"og:locale",content:null===(t=o.YZ[d])||void 0===t?void 0:t.ogLocale}),(0,a.jsx)("meta",{property:"article:published_time",content:r.date}),(0,a.jsx)("meta",{property:"article:modified_time",content:r.date}),(0,a.jsx)("meta",{property:"article:author",content:o.A5}),(null!==(s=r.topics)&&void 0!==s?s:[]).map(e=>(0,a.jsx)("meta",{property:"article:tag",content:e.name},e.name)),(0,a.jsx)("meta",{name:"twitter:card",content:"summary_large_image"}),(0,a.jsx)("meta",{name:"twitter:title",content:r.title}),(0,a.jsx)("meta",{name:"twitter:description",content:r.summary}),(0,a.jsx)("meta",{name:"twitter:image",content:h}),(0,a.jsx)("meta",{name:"twitter:creator",content:o.jT}),(0,a.jsx)("meta",{name:"twitter:site",content:o.jT}),(0,a.jsx)("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(j)}})]}),(0,a.jsx)(C,{post:r})]})}}},e=>{var t=t=>e(e.s=t);e.O(0,[787,805,285,268,636,593,792],()=>t(55692)),_N_E=e.O()}]);