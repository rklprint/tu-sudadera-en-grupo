import { GILDAN_18500_SIZE_GUIDE, GILDAN_2000_SIZE_GUIDE } from '@/lib/size-guides';
import styles from './size-guide.module.css';

export function SizeGuide({ model, sizes }: { model: string; sizes: readonly string[] }) {
  const guide = [GILDAN_18500_SIZE_GUIDE, GILDAN_2000_SIZE_GUIDE].find(item => model.trim().toLowerCase() === item.model.toLowerCase());
  if (!guide) return null;
  const isShirt = guide.model === 'Gildan 2000';
  const garment = isShirt ? 'camiseta' : 'sudadera';
  const rows = guide.measurements.filter(row => sizes.includes(row.size));
  if (!rows.length) return null;

  return <details className={styles.guide}>
    <summary>Guía de tallas · cm <span>{guide.model}</span></summary>
    <div className={styles.content}>
      <div className={styles.measurements}>
        <table>
          <caption>Medidas de la {garment} extendida</caption>
          <thead><tr><th scope="col">Talla</th><th scope="col">A · Ancho<br />(cm)</th><th scope="col">B · Largo<br />(cm)</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.size}><th scope="row">{row.size}</th><td>{row.widthCm}</td><td>{row.lengthCm}</td></tr>)}</tbody>
        </table>
        <p className={styles.note}>El ancho se mide en plano: no es el contorno del cuerpo. Medidas orientativas; pueden existir pequeñas variaciones entre prendas.</p>
      </div>
      <div className={styles.instructions}>
        <svg viewBox="0 0 300 270" role="img" aria-label="Esquema: A es el ancho horizontal bajo las sisas y B el largo desde el hombro hasta el bajo." className={styles.diagram}>
          <path d={isShirt ? "M112 58 Q150 84 188 58 L220 72 L264 120 L234 145 L210 122 L210 250 L90 250 L90 122 L66 145 L36 120 L80 72 Z" : "M112 58 Q104 12 150 12 Q196 12 188 58 L220 72 L270 188 L241 202 L210 135 L210 250 L90 250 L90 135 L59 202 L30 188 L80 72 Z"} fill="#edf7fb" stroke="#152137" strokeWidth="3" strokeLinejoin="round" />
          <path d={isShirt ? "M112 66 Q150 92 188 66 M92 240 H208" : "M112 58 Q150 92 188 58 M150 16 L150 72 M92 232 H208"} fill="none" stroke="#65778b" strokeWidth="2" />
          <path d="M95 145 H205 M102 139 L95 145 L102 151 M198 139 L205 145 L198 151 M190 64 V246 M184 71 L190 64 L196 71 M184 239 L190 246 L196 239" fill="none" stroke="#17669b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <text x="143" y="133" fill="#17669b" fontSize="22" fontWeight="700">A</text>
          <text x="163" y="206" fill="#17669b" fontSize="22" fontWeight="700">B</text>
        </svg>
        <h3>Cómo elegir tu talla</h3>
        <p>Extiende una {garment} que te quede bien sobre una superficie plana, sin estirarla, y compárala con la tabla.</p>
        <ol><li><strong>A · Ancho:</strong> mide de lado a lado, justo por debajo de las sisas.</li><li><strong>B · Largo:</strong> mide desde la parte alta del hombro, junto al cuello, hasta el bajo.{!isShirt && ' No incluyas la capucha.'}</li></ol>
      </div>
    </div>
    <p className={styles.source}>Fuente: <a href={guide.source} target="_blank" rel="noopener noreferrer">Catálogo europeo de Gildan 2025, págs. 16–17 (abre otra pestaña)</a>.</p>
  </details>;
}
