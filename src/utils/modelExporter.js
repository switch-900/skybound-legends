import * as THREE from 'three';
import { GLTFExporter } from 'three-stdlib';
import { saveAs } from 'file-saver';

/**
 * Exports a Three.js object (scene/mesh/group) as a GLB file
 * @param {THREE.Object3D} object - The 3D object to export
 * @param {string} fileName - Name of the file to save
 */
export const exportToGLB = (object, fileName) => {
  const exporter = new GLTFExporter();
  const options = {
    binary: true, // true for .glb, false for .gltf
    animations: [], // include animations if any
    embedImages: true, // embed images in the exported file
  };

  exporter.parse(
    object,
    (buffer) => {
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      saveAs(blob, `${fileName}.glb`);
    },
    (error) => {
      console.error('An error occurred while exporting the model:', error);
    },
    options
  );
};

/**
 * Converts a React Three Fiber scene to a Three.js scene for export
 * @param {Object} sceneRef - React ref pointing to a scene or group
 * @returns {THREE.Scene} - Three.js scene object
 */
export const prepareForExport = (sceneRef) => {
  if (!sceneRef.current) {
    throw new Error('Scene ref is not available');
  }
  
  // Clone the object to avoid modifying the original
  const clone = sceneRef.current.clone();
  
  // Apply all transformations globally
  clone.traverse((node) => {
    if (node.geometry) {
      node.updateMatrixWorld(true);
    }
  });
  
  return clone;
};
