import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Goal } from '@/types'; // Import our new shared type

// The async function that does the server work
const fetchGoals = async (userId: string): Promise<Goal[]> => {
  const goalsRef = collection(db, 'goals');
  const q = query(
    goalsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  
  // Map the Firestore documents, ensuring 'id' is included
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id, // Assign the document ID to the 'id' field
  }) as Goal);
};

// The custom hook that our components will use
export const useGoalsQuery = () => {
  const user = auth.currentUser;
  
  return useQuery({
    // The query key: ['goals', 'userId']
    queryKey: ['goals', user?.uid],
    
    queryFn: () => fetchGoals(user!.uid),
    
    // Only run this query if the user is logged in
    enabled: !!user,
  });
};