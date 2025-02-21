

class DataModelsManager {
  constructor() {
    this.data = null;
    this.models = null;
  }

  parseDataCSV(csvText) {
    const parsedData = d3.csvParse(csvText, function (d) {
      return {
        time: +d.time,
        flux: +d.flux,
        flux_err: +d.flux_err,
        fwhm: +d.fwhm,
        pixel_shift: +d.pixel_shift
      };
    });
    return parsedData;
  }

  parseModelsCSV(csvText) {
    const lines = csvText.split('\n');
    const columns = lines[0].trim().split(',');
    const parsedData = d3.csvParse(csvText, function (d) {
      const rowData = {};
      columns.forEach((column, index) => {
        rowData[column] = +d[index];
      });
      return rowData;
    });
    return parsedData;
  }

  fetchFile(token, fileType, parseFunction) {
    const url = token ? `/get_${fileType}/${token}` : `/get_${fileType}/`;
    console.log(`Fetching ${fileType} - URL:`, url);

    return fetch(url)
      .then(response => {
        console.log(`Response for ${fileType}:`, response);
        if (!response.ok) {
          throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        return response.arrayBuffer();      
      })
      .then(arrayBuffer => {
        const decompressedData = pako.inflate(arrayBuffer, { to: 'string' });
        return decompressedData;
      })
      .then(response_data => parseFunction(response_data))
      .catch(error => {
        console.error(`Error during fetch ${fileType}:`, error);
        throw error;
      });
  }

  fetchData(token = null) {
    return Promise.all([
      this.fetchFile(token, 'data', this.parseDataCSV),
      this.fetchFile(token, 'models', this.parseModelsCSV)
    ]).then(([newData, newModels]) => ({ newData, newModels }));
  }

  getNewData(token = null) {
    return new Promise((resolve, reject) => {
      this.fetchData(token)
        .then(({ newData, newModels }) => {
          this.data = newData;
          this.models = newModels;
          console.log('Data:', this.data);
          console.log('Models:', this.models);
          resolve();
        })
        .catch(error => {
          console.error('Error during getNewData:', error);
          reject(error);
        });
    });
  }
}

export default DataModelsManager;