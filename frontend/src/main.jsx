import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import App from './App'

// Microsoft Clarity
;(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)}
    t=l.createElement(r)
    t.async=1
    t.src="https://www.clarity.ms/tag/"+i
    y=l.getElementsByTagName(r)[0]
    y.parentNode.insertBefore(t,y)
})(window, document, "clarity", "script", "x0xq52c00u")

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)