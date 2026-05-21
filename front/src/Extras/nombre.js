import { useEffect } from 'react';

export const usePageTitle = (title, siteName = 'Tlamatini') => {
  useEffect(() =>{
    document.title=title || siteName;
  }, [title, siteName]);
};
export default usePageTitle;
