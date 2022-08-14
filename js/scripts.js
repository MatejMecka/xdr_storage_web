const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop),
});

const WORKER_URL = "http://0.0.0.0:8787"
const SIMPLE_SIGNER_URL = 'https://sign.plutodao.finance';
const XDR_FIELD = document.querySelector("#xdr-area")
const SNACKBAR = document.querySelector("#toast")

const check_if_empty_xdr = function(XDR){
    if (XDR == "") {
      const data = {message: 'XDR Cannot be empty!'};
      SNACKBAR.MaterialSnackbar.showSnackbar(data);
      return true
    }
  return false
}

const check_if_valid_xdr = function(XDR) {
  try {
    const tx = new StellarSdk.Transaction(XDR, StellarSdk.Networks.PUBLIC)
    return true
  } catch (error) {
    console.error(error)
    const data = {message: 'Invalid XDR!'};
    SNACKBAR.MaterialSnackbar.showSnackbar(data);
    return false
  }
}

const shareXDR = async function(event){
  // Check if XDR is empty
  const XDR = XDR_FIELD.value
  if(check_if_empty_xdr(XDR)){
    return
  }

  
  // Check if Valid XDR
  if(!check_if_valid_xdr(XDR)){
    return
  }

  const RESPONSE_BODY = {
    "xdr": XDR_FIELD.value
  }
  
  fetch(`${WORKER_URL}/store`, {
    body: JSON.stringify(RESPONSE_BODY),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  })
  .then((response) => response.json())
  .then(async data => {
    console.log(data)
    
    const shareData = {
        title: 'Pass that Signature!',
        text: 'Your signature has been requested!',
        url: data["storedURL"]
      }
    let snackbar_data = {message: 'Shared with Share Dialog'};
    
    try {
      await navigator.share(shareData);
    } catch (error) {
      navigator.clipboard.writeText(shareData["url"]);
      snackbar_data['message'] = "Copied to Clipboard"
    }
    
    SNACKBAR.MaterialSnackbar.showSnackbar(data);
    
  }).catch(error => {
    console.error(error)
    const data = {message: 'Communication with Server failed!'};
    SNACKBAR.MaterialSnackbar.showSnackbar(data);
  })
}

const signXDR = function(event){
   // Check if XDR is empty
  const XDR = XDR_FIELD.value
  if(check_if_empty_xdr(XDR)){
    return
  }
  
  const signWindow = window.open(
    `${SIMPLE_SIGNER_URL}/sign?xdr=${XDR}`,
    'Sign_Window',
    'width=360, height=700',
  );
  
  window.addEventListener('message', handle_simple_signer);
  
}


const handle_simple_signer = function(event) {
  // Check if It's Simple Signer
  if (event.origin !== SIMPLE_SIGNER_URL) {
      return;
  }

  console.log(event.data.type)
  if (event.data.type == "onCancel") {
    const data = {message: 'SimpleSigner cancelled!'};
    SNACKBAR.MaterialSnackbar.showSnackbar(data);
  }
 
  if (event.data.type == "onSign" && event.data.page === 'sign') {
    XDR_FIELD.value = event.data.message.signedXDR

    const data = {message: 'XDR Signed!'};
    SNACKBAR.MaterialSnackbar.showSnackbar(data);
  }

  console.log(event)
  
}

const check_for_existing_xdr = async function(){
  const slug = params.SLUG

  if(slug == null){
    return
  }
  
  await fetch(`${WORKER_URL}/${slug}`, {
    "method": "GET",
    "mode": "cors"
  }).then((response) => response.json())
  .then(async data => {
    XDR_FIELD.value = data["xdr"]
    const snackbar_data = {message: 'Loaded snippet!'};
    SNACKBAR.MaterialSnackbar.showSnackbar(snackbar_data);
  }).catch(err => {
    const data = {message: 'Snippet not found or error accessing Cloudflare Worker!'};
    SNACKBAR.MaterialSnackbar.showSnackbar(data);
  });

}

check_for_existing_xdr()
document.querySelector('#share-xdr').addEventListener("click", shareXDR);
document.querySelector('#sign-xdr').addEventListener("click", signXDR);