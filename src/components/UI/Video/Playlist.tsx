import { useCallback, useEffect, useState } from "react"
import { GET } from "../../Requests"

export const PLAYLIST = () => {
  const [playlists, setPlaylists] = useState<any>([])

  const handlePlaylistsFetching = useCallback(async () => {
    try {
      const response = await GET("")
    } catch (error) {
      console.error("Error fetching playlists:", error)
    }
  }, [])

  useEffect(() => {
    handlePlaylistsFetching()
  }, [])
    return (
      <></>
    )
}