(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[422],{61451:(e,t,a)=>{"use strict";a.r(t),a.d(t,{__N_SSG:()=>b,default:()=>w});var n=a(37876),o=a(95429),c=a(59414),s=a(16268),r=a(89468),i=a(14232),l=a(9506),m=a(22662),p=a(97460),d=a(86059),h=a(54587),x=a.n(h);function j(e){let{posts:t,interval:a=5e3}=e,[o,s]=(0,i.useState)(0),r=(0,i.useCallback)(e=>{s(e)},[]);return(0,n.jsxs)("div",{className:"carousel-wrapper",children:[(0,n.jsx)(l.A,{className:"mx-auto rounded overflow-hidden",style:{maxWidth:"800px",width:"100%"},prevIcon:(0,n.jsx)(p.g,{className:"carousel-control-prev-icon",icon:"chevron-left",size:"lg"}),nextIcon:(0,n.jsx)(p.g,{className:"carousel-control-next-icon",icon:"chevron-right",size:"lg"}),activeIndex:o,onSelect:r,interval:a,wrap:!0,indicators:!1,children:t.map(e=>(0,n.jsxs)(l.A.Item,{children:[(0,n.jsx)(d.A,{href:"/posts/".concat(e.id),children:(0,n.jsx)("div",{className:"thumbnail-wrapper",children:(0,n.jsx)(x(),{src:"".concat(c.J$).concat(e.thumbnail),alt:e.title,className:"d-block w-100 rounded",width:1200,height:630,style:{objectFit:"cover"}})})}),(0,n.jsxs)(l.A.Caption,{className:"text-center bg-opacity-75 p-3 rounded",children:[(0,n.jsx)("h3",{className:"fw-bold mb-3",children:(0,n.jsx)(d.A,{href:"/posts/".concat(e.id),className:"link-light",children:e.title})}),e.topics&&e.topics.length>0&&(0,n.jsx)("div",{className:"mb-4",children:e.topics.map(e=>(0,n.jsx)(d.A,{href:"/topics/".concat(e.id),children:(0,n.jsx)(m.A,{bg:e.color,className:"me-2 badge-".concat(e.color),children:e.name})},e.id))})]})]},e.id))}),(0,n.jsx)("div",{className:"carousel-indicators",children:t.map((e,t)=>(0,n.jsx)("button",{type:"button",className:"".concat(o===t?"active":""),onClick:()=>r(t),"aria-label":"Go to slide ".concat(t+1),children:(0,n.jsx)(p.g,{className:"carousel-indicator-icon",icon:"circle",size:"sm"})},e.id))})]})}var u=a(89099),g=a(45428),y=a.n(g),_=a(88430),b=!0;function w(e){let{posts:t,topics:a}=e,{t:i}=(0,o.Bd)("home");console.log(t);let l=(0,u.useRouter)().query.locale||y().i18n.defaultLocale,m={"@context":"https://schema.org","@type":"WebSite",name:i("home.meta.title"),description:i("home.meta.description"),potentialAction:{"@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:"".concat(c.W6,"/").concat(l,"/search?q={search_term_string}")},"query-input":{"@type":"PropertyValueSpecification",valueRequired:!0,valueName:"search_term_string"}}};return(0,n.jsxs)(s.A,{posts:t,topics:a,searchEnabled:!0,sidebarEnabled:!0,children:[(0,n.jsx)(_.A,{type:"website",title:i("home.title"),ogTitle:i("home.meta.title"),description:i("home.meta.description"),keywords:i("home.meta.keywords"),path:"",image:c.a6,jsonLd:m}),(0,n.jsxs)("header",{className:"text-center py-4",children:[(0,n.jsx)("h1",{className:"fw-bold mb-4",children:i("home.header.title")}),(0,n.jsx)("p",{className:"text-muted fs-4",children:i("home.header.subtitle")})]}),(0,n.jsx)(j,{posts:t.slice(0,3)}),(0,n.jsx)(r.A,{posts:t,topics:a})]})}},85779:(e,t,a)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]",function(){return a(61451)}])},88430:(e,t,a)=>{"use strict";a.d(t,{A:()=>p});var n=a(37876);a(14232);var o=a(77328),c=a.n(o),s=a(89099),r=a(45428),i=a.n(r),l=a(59414),m=a(95429);let p=e=>{var t;let{title:a,ogTitle:o,description:r,keywords:p="",image:d=l.FW,type:h="website",jsonLd:x,path:j="",profile:u,article:g}=e,y=(0,s.useRouter)(),_=y.query.locale||i().i18n.defaultLocale,{page:b,size:w}=y.query,N=new URLSearchParams;b&&N.append("page",String(b)),w&&N.append("size",String(w));let f=N.toString()?"".concat(l.W6,"/").concat(_).concat(j,"?").concat(N):"".concat(l.W6,"/").concat(_).concat(j),v="".concat(l.W6).concat(d),{t:A}=(0,m.Bd)("common"),S=A("common:common.siteName"),k=x?{...x,url:f}:null;return(0,n.jsxs)(c(),{children:[(0,n.jsxs)("title",{children:[a," | ",S]}),(0,n.jsx)("meta",{name:"description",content:r}),(0,n.jsx)("link",{rel:"canonical",href:f}),p&&(0,n.jsx)("meta",{name:"keywords",content:p}),(0,n.jsx)("meta",{name:"author",content:l.A5}),(0,n.jsx)("meta",{name:"robots",content:"index, follow, max-image-preview:large, max-snippet:-1"}),(0,n.jsx)("meta",{property:"og:title",content:o}),(0,n.jsx)("meta",{property:"og:description",content:r}),(0,n.jsx)("meta",{property:"og:type",content:h}),(0,n.jsx)("meta",{property:"og:url",content:f}),(0,n.jsx)("meta",{property:"og:site_name",content:A("common:common.siteName")}),(0,n.jsx)("meta",{property:"og:image",content:v}),(0,n.jsx)("meta",{property:"og:locale",content:null===(t=l.YZ[_])||void 0===t?void 0:t.ogLocale}),(0,n.jsx)("meta",{property:"og:image:width",content:"1200"}),(0,n.jsx)("meta",{property:"og:image:height",content:"630"}),(0,n.jsx)("meta",{property:"og:image:type",content:"image/jpeg"}),u&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("meta",{property:"profile:first_name",content:u.first_name}),(0,n.jsx)("meta",{property:"profile:last_name",content:u.last_name})]}),g&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("meta",{property:"article:published_time",content:g.published_time}),(0,n.jsx)("meta",{property:"article:modified_time",content:g.modified_time}),(0,n.jsx)("meta",{property:"article:author",content:l.A5}),g.tags&&g.tags.map(e=>(0,n.jsx)("meta",{property:"article:tag",content:e},e))]}),(0,n.jsx)("meta",{name:"twitter:card",content:"summary_large_image"}),(0,n.jsx)("meta",{name:"twitter:creator",content:l.jT}),(0,n.jsx)("meta",{name:"twitter:site",content:l.jT}),k&&(0,n.jsx)("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(k)}})]})}}},e=>{var t=t=>e(e.s=t);e.O(0,[121,701,787,805,709,506,268,468,636,593,792],()=>t(85779)),_N_E=e.O()}]);