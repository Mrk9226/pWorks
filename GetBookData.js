
async function getBookDataFromOpenLibrary(isbn) {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const res = await fetch(url);
  const json = await res.json();
  const data = json[`ISBN:${isbn}`];
  if (!data) return null;

  return {
    titolo: data.title,
    autori: data.authors?.map(a => a.name).join(", "),
    editore: data.publishers?.map(p => p.name).join(", "),
    anno: data.publish_date,
    pagine: data.number_of_pages,
    thumbnail: data.cover?.medium
  };
}
