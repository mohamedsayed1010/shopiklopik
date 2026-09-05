import { useQuery } from "@tanstack/react-query";

import { getCreateAdForm } from "../../api/createAd/createAd";


export default function useCreateAdForm(
  categoryId,
  subCategoryId
) {

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({

    queryKey:[
      "create-ad-form",
      categoryId,
      subCategoryId
    ],


    queryFn:()=> 
      getCreateAdForm(
        categoryId,
        subCategoryId
      ),


    enabled:
      !!categoryId &&
      !!subCategoryId

  });



  return {
    formData:data?.data || null,
    isLoading,
    isError,
    error,
  };

}