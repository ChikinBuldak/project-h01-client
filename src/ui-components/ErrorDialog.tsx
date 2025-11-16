import { useUiStore } from "@/stores"


export function ErrorDialog() {
    const {error, setError} = useUiStore();

    if (error === null) {
        return null;
    }

    return (
        <div className="fixed inset-0 flex w-full h-full z-100">
            <div className="rounded-lg w-[40%] h-[40%] bg-white flex flex-col">
                // This is the header
                <div className="bg-teal-800 w-full h-[10%] flex items-center">
                    <h2 className="font-bold text-white">
                        Error: {error.code}
                    </h2>
                </div> 

                // This is the message content
                <div className=" w-full flex justify-center items-center">
                    <p className="text-black">
                        {error.message}
                    </p>
                </div>

                <div className="w-full flex items-center">
                    <button onClick={()=> setError(null)}>
                        Ok
                    </button>
                </div>

            </div>
        </div>
    )
}