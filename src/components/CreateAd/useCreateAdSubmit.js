import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import axiosInstance from "../../api/axiosInstance";



async function submitDynamicAd({
  endpoint,
  method,
  formData,
}) {


  const response =
    await axiosInstance({

      url: endpoint,

      method: method || "POST",

      data: formData,

      headers:{
        "Content-Type":"multipart/form-data"
      }

    });


  return response.data;

}







export default function useCreateAdSubmit({

  onSuccess,

  onError,

} = {}) {



  return useMutation({


    mutationFn: submitDynamicAd,



    onSuccess:(data)=>{


      toast.success(
        "تم إرسال إعلانك بنجاح، وهو الآن قيد المراجعة من الإدارة قبل النشر.",
        { duration: 6000 }
      );



      if(onSuccess){

        onSuccess(data);

      }


    },



    onError:(error)=>{

      if(onError){

        onError(error);

      }

    }

  });


}