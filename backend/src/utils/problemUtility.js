const axios = require('axios');


const getLanguageById = (lang)=>{

    const language = {
        "c++":54,
        "java":62,
        "javascript":63
    }


    return language[lang.toLowerCase()];
}


const submitBatch = async (submissions)=>{


const options = {
  method: 'POST',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    base64_encoded: 'false'
  },
  headers: {
    'x-rapidapi-key': process.env.JUDGE0_KEY,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: {
    submissions
  }
};

async function fetchData() {
	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}

 return await fetchData();

}


// Bug 1 fix: the old version returned from inside setTimeout's callback, so the
// promise resolved immediately and never actually waited. A real delay promise:
const waiting = (timer) => new Promise((resolve) => setTimeout(resolve, timer));

// ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]

const submitToken = async(resultToken)=>{

const options = {
  method: 'GET',
  url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
  params: {
    tokens: resultToken.join(","),
    base64_encoded: 'false',
    fields: '*'
  },
  headers: {
    'x-rapidapi-key': process.env.JUDGE0_KEY,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
  }
};

async function fetchData() {
	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}


 // Bug 3 fix: bound the poll so a stuck Judge0 token can't loop forever.
 // ~30 attempts * 1s = 30s ceiling. (Replaced entirely by BullMQ in Section B6.)
 const MAX_ATTEMPTS = 30;

 for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {

  const result = await fetchData();

  if (!result || !result.submissions) {
    // transient network/Judge0 error from fetchData — back off and retry
    await waiting(1000);
    continue;
  }

  const IsResultObtained = result.submissions.every((r) => r.status_id > 2);

  if (IsResultObtained)
    return result.submissions;

  await waiting(1000);
 }

 throw new Error("Judge0 timed out: results not ready after 30s");

}


module.exports = {getLanguageById,submitBatch,submitToken};








// 


