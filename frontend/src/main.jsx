import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import App from './App'

// ==============================
// Google Analytics
// ==============================

const GA_ID = 'G-ZS154N0ZD1'

const script = document.createElement('script')
script.async = true
script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
document.head.appendChild(script)

window.dataLayer = window.dataLayer || []

function gtag() {
  window.dataLayer.push(arguments)
}

window.gtag = gtag

gtag('js', new Date())
gtag('config', GA_ID)

// ==============================
// Microsoft Clarity
// ==============================

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