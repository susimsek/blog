(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[899],{6642:(e,t,n)=>{(window.__NEXT_P=window.__NEXT_P||[]).push(["/[locale]/contact",function(){return n(44368)}])},29985:(e,t,n)=>{"use strict";n.d(t,{A:()=>c});var a=n(37876);n(14232);var o=n(97460),s=n(95429),r=n(59414);let c=()=>{let{t:e}=(0,s.Bd)("common");return(0,a.jsxs)("ul",{className:"list-unstyled fs-5 mt-3",children:[(0,a.jsxs)("li",{className:"mb-3",children:[(0,a.jsx)(o.g,{icon:"envelope",className:"me-2 email-logo"}),(0,a.jsxs)("strong",{children:[e("common.contactInfo.email"),":"]})," ",(0,a.jsx)("a",{href:"mailto:".concat(r.tY.email),className:"text-decoration-none",children:r.tY.email})]}),(0,a.jsxs)("li",{className:"mb-3",children:[(0,a.jsx)(o.g,{icon:["fab","linkedin"],className:"me-2 linkedin-brand-logo"}),(0,a.jsxs)("strong",{children:[r.g_.linkedin,":"]})," ",(0,a.jsx)("a",{href:r.tY.linkedin,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:r.tY.linkedin})]}),(0,a.jsxs)("li",{className:"mb-3",children:[(0,a.jsx)(o.g,{icon:["fab","medium"],className:"me-2 medium-brand-logo"}),(0,a.jsxs)("strong",{children:[r.g_.medium,":"]})," ",(0,a.jsx)("a",{href:r.tY.medium,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:r.tY.medium})]}),(0,a.jsxs)("li",{className:"mb-3",children:[(0,a.jsx)(o.g,{icon:["fab","github"],className:"me-2 github-brand-logo"}),(0,a.jsxs)("strong",{children:[r.g_.github,":"]})," ",(0,a.jsx)("a",{href:r.tY.github,target:"_blank",rel:"noopener noreferrer",className:"text-decoration-none",children:r.tY.github})]})]})}},44368:(e,t,n)=>{"use strict";n.r(t),n.d(t,{__N_SSG:()=>l,default:()=>d});var a=n(37876);n(14232);var o=n(77478),s=n(95429),r=n(59414),c=n(16268),i=n(29985),m=n(88430),l=!0;function d(e){let{posts:t,topics:n}=e,{t:l}=(0,s.Bd)(["contact"]),d={"@context":"https://schema.org","@type":"ContactPage",name:l("contact.meta.title"),description:l("contact.meta.description"),author:{"@type":"Person",name:r.A5,url:r.W6,image:"".concat(r.W6).concat(r.FW),jobTitle:l("contact.jobTitle"),email:r.tY.email,sameAs:[r.tY.linkedin,r.tY.medium,r.tY.github]}};return(0,a.jsxs)(c.A,{posts:t,topics:n,searchEnabled:!0,sidebarEnabled:!0,children:[(0,a.jsx)(m.A,{title:l("contact.title"),ogTitle:l("contact.meta.title"),description:l("contact.meta.description"),keywords:l("contact.meta.keywords"),image:r.FW,type:"website",path:"/contact",jsonLd:d}),(0,a.jsxs)(o.A,{className:"py-5",style:{maxWidth:"800px"},children:[(0,a.jsx)("h1",{className:"fw-bold mb-4",children:l("contact.header")}),(0,a.jsx)("p",{className:"fs-5",children:l("contact.description")}),(0,a.jsx)("h2",{className:"fw-bold mt-4",children:l("contact.title")}),(0,a.jsx)(i.A,{})]})]})}},88430:(e,t,n)=>{"use strict";n.d(t,{A:()=>d});var a=n(37876);n(14232);var o=n(77328),s=n.n(o),r=n(89099),c=n(45428),i=n.n(c),m=n(59414),l=n(95429);let d=e=>{var t;let{title:n,ogTitle:o,description:c,keywords:d="",image:p=m.FW,type:g="website",jsonLd:x,path:j="",profile:h,article:u}=e,b=(0,r.useRouter)(),y=b.query.locale||i().i18n.defaultLocale,{page:_,size:f}=b.query,N=new URLSearchParams;_&&N.append("page",String(_)),f&&N.append("size",String(f));let w=N.toString()?"".concat(m.W6,"/").concat(y).concat(j,"?").concat(N):"".concat(m.W6,"/").concat(y).concat(j),k="".concat(m.W6).concat(p),{t:Y}=(0,l.Bd)("common"),v=Y("common:common.siteName"),A=x?{...x,url:w}:null;return A&&u&&(A.mainEntityOfPage=w),(0,a.jsxs)(s(),{children:[(0,a.jsxs)("title",{children:[n," | ",v]}),(0,a.jsx)("meta",{name:"description",content:c}),(0,a.jsx)("link",{rel:"canonical",href:w}),d&&(0,a.jsx)("meta",{name:"keywords",content:d}),(0,a.jsx)("meta",{name:"author",content:m.A5}),(0,a.jsx)("meta",{name:"robots",content:"index, follow, max-image-preview:large, max-snippet:-1"}),(0,a.jsx)("meta",{property:"og:title",content:o}),(0,a.jsx)("meta",{property:"og:description",content:c}),(0,a.jsx)("meta",{property:"og:type",content:g}),(0,a.jsx)("meta",{property:"og:url",content:w}),(0,a.jsx)("meta",{property:"og:site_name",content:Y("common:common.siteName")}),(0,a.jsx)("meta",{property:"og:image",content:k}),(0,a.jsx)("meta",{property:"og:locale",content:null===(t=m.YZ[y])||void 0===t?void 0:t.ogLocale}),(0,a.jsx)("meta",{property:"og:image:width",content:"1200"}),(0,a.jsx)("meta",{property:"og:image:height",content:"630"}),(0,a.jsx)("meta",{property:"og:image:type",content:"image/jpeg"}),h&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("meta",{property:"profile:first_name",content:h.first_name}),(0,a.jsx)("meta",{property:"profile:last_name",content:h.last_name})]}),u&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("meta",{property:"article:published_time",content:u.published_time}),(0,a.jsx)("meta",{property:"article:modified_time",content:u.modified_time}),(0,a.jsx)("meta",{property:"article:author",content:m.A5}),u.tags&&u.tags.map(e=>(0,a.jsx)("meta",{property:"article:tag",content:e},e))]}),(0,a.jsx)("meta",{name:"twitter:card",content:"summary_large_image"}),(0,a.jsx)("meta",{name:"twitter:creator",content:m.jT}),(0,a.jsx)("meta",{name:"twitter:site",content:m.jT}),A&&(0,a.jsx)("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(A)}})]})}}},e=>{var t=t=>e(e.s=t);e.O(0,[787,805,268,636,593,792],()=>t(6642)),_N_E=e.O()}]);