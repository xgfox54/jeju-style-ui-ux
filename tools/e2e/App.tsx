import * as React from "react"

import JejuExampleForm from "@/components/jeju-example-form"
import JejuExampleGallery from "@/components/jeju-example-gallery"
import JejuExamplePublic from "@/components/jeju-example-public"
import JejuExampleWork from "@/components/jeju-example-work"

// 검증용 앱: #/work · #/form · #/public 으로 세 기준 예제를 오간다.
function useRoute() {
  const read = () => (window.location.hash.startsWith("#/") ? window.location.hash.slice(2) : "work")
  const [route, setRoute] = React.useState(read)
  React.useEffect(() => {
    const onHash = () => {
      if (window.location.hash.startsWith("#/")) {
        setRoute(read())
        window.scrollTo(0, 0)
      }
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  return route
}

export default function App() {
  const route = useRoute()
  if (route === "form") return <JejuExampleForm />
  if (route === "public") return <JejuExamplePublic />
  if (route === "gallery") return <JejuExampleGallery />
  return <JejuExampleWork />
}

