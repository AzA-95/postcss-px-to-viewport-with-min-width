"use strict";var e=require("postcss");const n=e=>Array.isArray(e),t=e=>e instanceof RegExp,r=(e,n)=>{if(!t(e))throw new Error("options.exclude should be RegExp.");return null!==n.match(e)},o=e=>"keyframes"===e,s=e=>-1!==e.indexOf("min-width")&&-1===e.indexOf("max-width"),a=e=>-1!==e.indexOf("(max-width:"),p=(e,n)=>{const t=10**(n+1),r=Math.floor(e*t);return 10*Math.round(r/10)/t},u=e=>(n,t)=>{if(!t)return n;const{minUnitValue:r,convertToUnit:o,viewportWidth:s,unitPrecision:a,unitWidthCssVar:u}=e,c=parseFloat(t);if(void 0!==r&&r>=c)return n;const i=p(c/s*100,a);return 0===i?"0":u?`calc(${i} * ${u})`:`${i}${o}`},c=(e,n,t)=>e?.some((e=>"decl"===e.type&&(e.prop===n&&e.value===t))),i=(e,n)=>e.some((e=>"string"==typeof e?-1!==n.indexOf(e):n.match(e))),l=({selectors:n,source:t})=>new e.Rule({selectors:n,source:t}),d=({name:n,params:t,source:r})=>new e.AtRule({name:n,params:t,source:r}),m=({prop:n,value:t,important:r})=>new e.Declaration({prop:n,value:t,important:r}),f=(e,n)=>{const t=(r=n.unitToConvert,new RegExp(`"[^"]+"|'[^']+'|url\\([^\\)]+\\)|(\\-?\\d*\\.?\\d+)${r}`,"g"));var r;if(-1===e.value.indexOf(n.unitToConvert))return null;const o=e.prev();if(o&&"comment"===o.type&&"px-to-viewport-ignore-next"===o.text)return o.remove(),null;const s=e.value.replace(t,u(n));return c(e.parent.nodes,e.prop,s)?null:m({prop:e.prop,value:s,important:e.important})},h=(e,n)=>{const t=[];if(e.selectors.forEach((e=>{i(n.selectorBlackList,e)||t.push(e)})),0===t.length)return null;const r=l({selectors:t,source:e.source});return e.walkDecls((e=>{const t=f(e,n);t&&r.append(t)})),r.nodes?.length>0?r:null},v=(e,n)=>{let t=!1;const r=e.clone().removeAll();return e.each((e=>{const o=h(e,n);if(o)return t=!0,void r.append(o);r.append(e.clone())})),t?r:null},x=e=>{const n=e.clone(),t=e=>{if(e.nodes){let n=e.nodes.length;for(;n--;){const r=e.nodes[n];"atrule"===r.type&&(t(r),r.nodes&&0!==r.nodes.length||r.remove())}}};return t(n),n.nodes&&n.nodes.length>0?n:null},w=(e,n,t)=>(e&&e.length>0&&e.forEach((e=>{if("atrule"===e.type&&!a(e.params)){if(s(e.params))return void w(e.nodes,n,t);if(o(e.name)){const r=v(e,t);return void(r&&n.append(r))}const r=d({name:e.name,params:e.params,source:e.source});n.append(r),w(e.nodes,r,t)}if("rule"===e.type){const r=h(e,t);r&&n.append(r)}})),n),g={unitPrecision:4,unitToConvert:"px",convertToUnit:"vw",viewportWidth:1280,selectorBlackList:[]},y=e=>{const p={...g,...e};let u=[],c=[];const i=e=>{c.push(e)},l=e=>{const n=h(e,p);n&&u.push(n)},m=e=>{const n=d({name:e.name,params:e.params,source:e.source}),t=w(e.nodes,n,p),r=x(t);r&&i(r)};return{postcssPlugin:"postcss-px-to-vw",Once(e){const{exclude:f}=p,h=e.source?.input.file||null;if(f&&h){if(!t(f)&&!n(f))throw new Error("options.exclude should be RegExp or Array of RegExp.");{const e=n(f)?f:[f];for(let n=0;n<e.length;n++)if(r(e[n],h))return}}e.each((e=>{if("atrule"===e.type&&(n=e.name,["media","supports","keyframes"].includes(n))&&!a(e.params)){if(o(e.name)){const n=v(e,p);return void(n&&i(n))}return s(e.params)?void e.each((e=>{"rule"!==e.type?"atrule"===e.type&&m(e):l(e)})):void m(e)}var n;"rule"===e.type&&l(e)}));const x=d({name:"media",params:`(min-width: ${p.viewportWidth}${p.unitToConvert})`,source:e.source});u.forEach((e=>{x.append(e)})),c.forEach((e=>{x.append(e)})),x.nodes&&x.nodes.length>0&&e.append(x),u=[],c=[]}}};y.postcss=!0,module.exports=y;
