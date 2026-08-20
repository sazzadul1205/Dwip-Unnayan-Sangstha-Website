import{c as f,r as l,j as e,H as y}from"./app-DrTgUkPP.js";import{G as n,F as h,aa as w,z as g,o as j,n as b,bq as N}from"./index-B3nNzE1w.js";function k(){const{data:i,setData:d,post:c,processing:t,errors:r,reset:m}=f({password:""}),[a,u]=l.useState(!1),[x,o]=l.useState(null),p=s=>{s.preventDefault(),c(route("password.confirm"),{onFinish:()=>m("password")})};return e.jsxs(e.Fragment,{children:[e.jsx(y,{title:"Confirm password"}),e.jsxs("div",{className:"min-h-screen flex items-center justify-center bg-linear-to-br from-yellow-50 via-orange-50 to-red-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden",children:[e.jsx("div",{className:"absolute -top-20 -right-20 w-64 h-64 bg-linear-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"}),e.jsx("div",{className:"absolute -bottom-20 -left-20 w-64 h-64 bg-linear-to-r from-red-400 to-pink-500 rounded-full blur-3xl opacity-20 animate-pulse animation-delay-1000"}),e.jsx("div",{className:"absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl"}),e.jsxs("div",{className:"max-w-md w-full space-y-8 relative z-10",children:[e.jsxs("div",{className:"text-center animate-fade-in-up",children:[e.jsx("div",{className:"flex justify-center mb-4",children:e.jsx("div",{className:"bg-linear-to-r from-yellow-500 to-orange-600 rounded-2xl p-3 shadow-lg transform hover:scale-105 transition-transform duration-300",children:e.jsx(n,{className:"h-8 w-8 text-white"})})}),e.jsx("h2",{className:"mt-6 text-3xl font-extrabold text-gray-900",children:"Confirm your password"}),e.jsx("p",{className:"mt-2 text-sm text-gray-600",children:"This is a secure area of the application. Please confirm your password before continuing."})]}),e.jsx("div",{className:"bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg animate-fade-in-up animation-delay-100",children:e.jsxs("div",{className:"flex",children:[e.jsx("div",{className:"shrink-0",children:e.jsx(n,{className:"h-5 w-5 text-yellow-400"})}),e.jsx("div",{className:"ml-3",children:e.jsx("p",{className:"text-sm text-yellow-700",children:"For your security, we need to verify your identity before accessing sensitive areas."})})]})}),e.jsx("form",{className:"mt-8 space-y-6",onSubmit:p,children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"animate-fade-in-up animation-delay-200",children:[e.jsx("label",{htmlFor:"password",className:"block text-sm font-medium text-gray-700 mb-1",children:"Password"}),e.jsxs("div",{className:`relative transition-all duration-300 ${x==="password"?"transform scale-[1.02]":""}`,children:[e.jsx("div",{className:"absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none",children:e.jsx(h,{className:"h-5 w-5 text-gray-400"})}),e.jsx("input",{id:"password",name:"password",type:a?"text":"password",required:!0,autoFocus:!0,autoComplete:"current-password",value:i.password,onChange:s=>d("password",s.target.value),onFocus:()=>o("password"),onBlur:()=>o(null),className:"appearance-none rounded-lg relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:z-10 sm:text-sm transition-all duration-300",placeholder:"Enter your password"}),e.jsx("button",{type:"button",onClick:()=>u(!a),className:"absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors",children:a?e.jsx(w,{className:"h-5 w-5"}):e.jsx(g,{className:"h-5 w-5"})})]}),r.password&&e.jsx("p",{className:"mt-1 text-sm text-red-600 animate-slide-in",children:r.password})]}),e.jsx("button",{type:"submit",disabled:t,className:"group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-linear-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg animate-fade-in-up animation-delay-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",children:t?e.jsx(j,{className:"animate-spin h-5 w-5"}):e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"absolute left-0 inset-y-0 flex items-center pl-3",children:e.jsx(b,{className:"h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-all duration-300"})}),"Confirm password",e.jsx(N,{className:"ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1"})]})}),e.jsxs("div",{className:"mt-6 p-4 bg-gray-50 rounded-lg animate-fade-in-up animation-delay-400",children:[e.jsx("h4",{className:"text-sm font-medium text-gray-900 mb-2",children:"Security Tips:"}),e.jsxs("ul",{className:"space-y-1 text-xs text-gray-600",children:[e.jsxs("li",{className:"flex items-center",children:[e.jsx("span",{className:"h-1.5 w-1.5 bg-yellow-400 rounded-full mr-2"}),"Never share your password with anyone"]}),e.jsxs("li",{className:"flex items-center",children:[e.jsx("span",{className:"h-1.5 w-1.5 bg-yellow-400 rounded-full mr-2"}),"Use a strong, unique password for this account"]}),e.jsxs("li",{className:"flex items-center",children:[e.jsx("span",{className:"h-1.5 w-1.5 bg-yellow-400 rounded-full mr-2"}),"Enable two-factor authentication for extra security"]})]})]})]})}),e.jsx("div",{className:"text-center text-sm animate-fade-in-up animation-delay-500",children:e.jsx("p",{className:"text-gray-600",children:e.jsx("a",{href:route("password.request"),className:"font-medium text-yellow-600 hover:text-yellow-700 transition-colors",children:"Forgot your password?"})})})]})]}),e.jsx("style",{children:`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.2;
                    }
                    50% {
                        opacity: 0.3;
                    }
                }
                
                .animate-fade-in-up {
                    animation: fadeInUp 0.6s ease-out forwards;
                    opacity: 0;
                }
                
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out forwards;
                }
                
                .animate-pulse {
                    animation: pulse 3s ease-in-out infinite;
                }
                
                .animation-delay-100 {
                    animation-delay: 0.1s;
                }
                
                .animation-delay-200 {
                    animation-delay: 0.2s;
                }
                
                .animation-delay-300 {
                    animation-delay: 0.3s;
                }
                
                .animation-delay-400 {
                    animation-delay: 0.4s;
                }
                
                .animation-delay-500 {
                    animation-delay: 0.5s;
                }
                
                .animation-delay-1000 {
                    animation-delay: 1s;
                }
            `})]})}export{k as default};
