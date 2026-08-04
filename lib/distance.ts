export async function getDistance(
    studentAddress: string,
    studentZip: string,
    employerAddress: string,
    employerZip: string
  ): Promise<{ distance: string; duration: string }> {
    try {
      const origin = `${studentAddress} ${studentZip}`
      const destination = `${employerAddress} ${employerZip}`
  
      const res = await fetch("/api/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origins: origin,
          destinations: destination,
        }),
      })
  
      const data = await res.json()
  
      if (data.error || !data.distance) {
        return { distance: "Unknown", duration: "" }
      }
  
      return {
        distance: data.distance,
        duration: data.duration,
      }
    } catch (err) {
      console.error("Distance fetch error:", err)
      return { distance: "Unknown", duration: "" }
    }
  }