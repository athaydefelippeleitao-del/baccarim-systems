import { exportImages } from 'pdf-export-images';

exportImages('C:\\\\Users\\\\Usuario\\\\Downloads\\\\RAP Hiraiwa.pdf', 'public\\\\extracted_images')
  .then(images => console.log('Exported', images.length, 'images'))
  .catch(console.error);
