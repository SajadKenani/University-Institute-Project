import { GET } from '@/components/auth/Request';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

interface studentAccounts {

}

export default function HomeScreen() {
  const [studentAccounts, setStudentAccounts] = useState()

  const handleMainAccountsFetching = useCallback(async () => {
    try {
    const response = await GET("api/fetch-accounts")
    } catch(error) { console.log(error) }
    
  }, [])

  useEffect(() => {
    handleMainAccountsFetching()
  }, [])
  return (
    <View>
   
    </View>
  );
}

