-- Agregar especificaciones a productos
-- Usando subqueries para evitar errores de sintaxis con LIMIT en UPDATE

-- Neumáticos y llantas
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tamaño', '205/55R16',
  'Material', 'Caucho de alta durabilidad',
  'Profundidad de surcos', '8.5mm',
  'Carga máxima', '900 kg',
  'Velocidad máxima', '240 km/h'
) WHERE id IN (
  SELECT id FROM productos WHERE nombre ILIKE '%neumático%' OR nombre ILIKE '%llanta%' ORDER BY id LIMIT 1
);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tamaño', '225/60R17',
  'Refuerzo lateral', 'Sí',
  'Profundidad de surcos', '9mm',
  'Peso', '12 kg',
  'Garantía', '3 años'
) WHERE id IN (
  SELECT id FROM productos WHERE nombre ILIKE '%neumático%' OR nombre ILIKE '%llanta%' ORDER BY id LIMIT 1 OFFSET 1
);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tamaño', '195/65R15',
  'Material', 'Caucho premium',
  'Tipo', 'Todo terreno',
  'Tracción', 'Excelente',
  'Durabilidad', '5 años'
) WHERE id IN (
  SELECT id FROM productos WHERE nombre ILIKE '%neumático%' OR nombre ILIKE '%llanta%' ORDER BY id LIMIT 1 OFFSET 2
);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tamaño', '215/55R18',
  'Material', 'Compuesto reforzado',
  'Resistencia', 'Alta',
  'Temperatura máxima', '150°C',
  'Certificación', 'DOT/ECE'
) WHERE id IN (
  SELECT id FROM productos WHERE nombre ILIKE '%neumático%' OR nombre ILIKE '%llanta%' ORDER BY id LIMIT 1 OFFSET 3
);

-- Frenos
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Pastillas de freno',
  'Material', 'Compuesto cerámico',
  'Espesor', '8mm',
  'Durabilidad', '80,000 km',
  'Compatibilidad', 'Universal'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%freno%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Disco de freno',
  'Diámetro', '280mm',
  'Material', 'Hierro fundido',
  'Grosor', '25mm',
  'Peso', '5.5 kg'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%freno%' ORDER BY id LIMIT 1 OFFSET 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Cilindro maestro',
  'Diámetro', '25mm',
  'Presión máxima', '350 bar',
  'Material', 'Aluminio',
  'Vida útil', '100,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%freno%' ORDER BY id LIMIT 1 OFFSET 2);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Líquido de frenos',
  'Volumen', '500ml',
  'Punto de ebullición', '205°C',
  'Viscosidad', 'ISO VG 32',
  'Clasificación', 'DOT 3'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%freno%' ORDER BY id LIMIT 1 OFFSET 3);

-- Motor
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Bujía',
  'Rosca', 'M14x1.25',
  'Distancia de electrodo', '0.8mm',
  'Material', 'Níquel-cromo',
  'Temperatura máxima', '900°C'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%motor%' AND nombre ILIKE '%bujía%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Alternador',
  'Potencia', '100A',
  'Voltaje', '12V',
  'RPM máximo', '15,000',
  'Material', 'Cobre y aluminio'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%motor%' ORDER BY id LIMIT 1 OFFSET 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Starter',
  'Potencia', '1.2 kW',
  'Voltaje', '12V',
  'Material', 'Acero reforzado',
  'Velocidad', '4,500 RPM'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%motor%' ORDER BY id LIMIT 1 OFFSET 2);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Radiador',
  'Capacidad', '8 litros',
  'Material', 'Aluminio',
  'Disipación térmica', '5 kW',
  'Presión máxima', '1.5 bar'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%motor%' ORDER BY id LIMIT 1 OFFSET 3);

-- Filtros
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Filtro de aire',
  'Tamaño', '150x200mm',
  'Material', 'Papel sintético',
  'Eficiencia', '99.9%',
  'Vida útil', '15,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%filtro%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Filtro de aceite',
  'Rosca', 'M20x1.5',
  'Capacidad', '0.8 litros',
  'Material', 'Papel',
  'Vida útil', '10,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%filtro%' ORDER BY id LIMIT 1 OFFSET 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Filtro de combustible',
  'Capacidad', '1 litro',
  'Material', 'Fibra de vidrio',
  'Diámetro', '75mm',
  'Vida útil', '20,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%filtro%' ORDER BY id LIMIT 1 OFFSET 2);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Filtro de cabina',
  'Tamaño', '200x150mm',
  'Material', 'Carbón activo',
  'Filtración', '95%',
  'Vida útil', '15,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%filtro%' ORDER BY id LIMIT 1 OFFSET 3);

-- Amortiguación
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Amortiguador',
  'Longitud', '350mm',
  'Diámetro', '50mm',
  'Compresión', 'Gas nitrógeno',
  'Resistencia', 'Ultra dura'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%amortiguad%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Resorte helicoidal',
  'Material', 'Acero templado',
  'Diámetro exterior', '120mm',
  'Carga', '2500 N',
  'Rigidez', 'Media'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%amortiguad%' ORDER BY id LIMIT 1 OFFSET 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Barra estabilizadora',
  'Material', 'Acero reforzado',
  'Diámetro', '24mm',
  'Largo', '1200mm',
  'Rigidez', 'Alta'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%amortiguad%' ORDER BY id LIMIT 1 OFFSET 2);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Conjunto de suspensión',
  'Componentes', '4 piezas',
  'Material', 'Acero y goma',
  'Compatibilidad', 'Universal',
  'Garantía', '2 años'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%amortiguad%' ORDER BY id LIMIT 1 OFFSET 3);

-- Embrague
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Disco de embrague',
  'Diámetro', '200mm',
  'Material', 'Hierro fundido',
  'Espesor', '7.5mm',
  'Par de fricción', '250 Nm'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%embrague%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Plato de presión',
  'Diámetro', '215mm',
  'Material', 'Acero fundido',
  'Presión', '1200 bar',
  'Vida útil', '100,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%embrague%' ORDER BY id LIMIT 1 OFFSET 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Cojinete de desembrague',
  'Material', 'Acero reforzado',
  'Diámetro exterior', '65mm',
  'Velocidad máxima', '15,000 RPM',
  'Vida útil', '80,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%embrague%' ORDER BY id LIMIT 1 OFFSET 2);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Kit completo de embrague',
  'Componentes', '3 piezas',
  'Material', 'OEM quality',
  'Compatibilidad', 'Universal',
  'Durabilidad', 'Garantizada'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%embrague%' ORDER BY id LIMIT 1 OFFSET 3);

-- Aceites y líquidos
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Aceite motor',
  'Volumen', '5 litros',
  'Viscosidad', '5W-30',
  'Especificación', 'ACEA A5',
  'Punto de inflamación', '200°C'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%aceite%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Líquido refrigerante',
  'Volumen', '1 litro',
  'Color', 'Verde',
  'Punto de congelación', '-37°C',
  'Durabilidad', '5 años'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%líquido%' OR nombre ILIKE '%refrigerante%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Líquido de dirección',
  'Volumen', '1 litro',
  'Viscosidad', 'ISO VG 46',
  'Temperatura máxima', '80°C',
  'Duración', '3 años'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%líquido%' ORDER BY id LIMIT 1 OFFSET 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Aceite de transmisión',
  'Volumen', '2 litros',
  'Viscosidad', 'SAE 80W-90',
  'Especificación', 'GL-4',
  'Temperatura máxima', '120°C'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%aceite%' ORDER BY id LIMIT 1 OFFSET 1);

-- Correas, cadenas y rodillos
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Correa de distribución',
  'Largo', '1200mm',
  'Ancho', '25mm',
  'Dientes', '120',
  'Material', 'Goma reforzada'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%correa%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Cadena de transmisión',
  'Largo', '520mm',
  'Eslabones', '104',
  'Material', 'Acero nitrurado',
  'Resistencia', '5000 kg'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%cadena%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Rodillo tensor',
  'Diámetro', '70mm',
  'Material', 'Aluminio reforzado',
  'Tensión máxima', '500 N',
  'Vida útil', '80,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%rodillo%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Kit de correas',
  'Componentes', '3 piezas',
  'Material', 'Goma industrial',
  'Compatibilidad', 'Universal',
  'Garantía', '18 meses'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%kit%' ORDER BY id LIMIT 1);

-- Carrocería
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Guardabarro',
  'Material', 'Plástico ABS',
  'Color', 'Negro',
  'Dimensiones', '500x300mm',
  'Peso', '0.8 kg'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%carrocería%' OR nombre ILIKE '%guardabarr%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Espejo retrovisor',
  'Material', 'Plástico y cristal',
  'Ajuste', 'Manual',
  'Tamaño', '150x120mm',
  'Protección', 'UV'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%carrocería%' ORDER BY id LIMIT 1 OFFSET 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Parachoques',
  'Material', 'Plástico reforzado',
  'Color', 'Negro',
  'Compatibilidad', 'Universal',
  'Instalación', 'Fácil'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%carrocería%' ORDER BY id LIMIT 1 OFFSET 2);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Moldura lateral',
  'Material', 'Aluminio anodizado',
  'Color', 'Plata',
  'Largo', '2000mm',
  'Acabado', 'Satinado'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%carrocería%' ORDER BY id LIMIT 1 OFFSET 3);

-- Sistema eléctrico
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Batería',
  'Voltaje', '12V',
  'Capacidad', '60 Ah',
  'Arranque', '500A',
  'Durabilidad', '3-5 años'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%eléctrico%' OR nombre ILIKE '%batería%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Cables de batería',
  'Sección', '50 mm²',
  'Material', 'Cobre puro',
  'Largo', '2 metros',
  'Temperatura máxima', '80°C'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%eléctrico%' ORDER BY id LIMIT 1 OFFSET 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Fusibles',
  'Voltaje', '12V-32V',
  'Corriente', '5-30A',
  'Tipo', 'Cilíndricos',
  'Cantidad', '10 unidades'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%eléctrico%' ORDER BY id LIMIT 1 OFFSET 2);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Relé',
  'Voltaje', '12V',
  'Corriente', '40A',
  'Resistencia', '70 mΩ',
  'Ciclos de vida', '1,000,000'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%eléctrico%' ORDER BY id LIMIT 1 OFFSET 3);

-- Suspensión
UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Buje de suspensión',
  'Material', 'Caucho reforzado',
  'Diámetro interior', '20mm',
  'Diámetro exterior', '45mm',
  'Durabilidad', '50,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%suspensión%' ORDER BY id LIMIT 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Brazo de suspensión',
  'Material', 'Acero forjado',
  'Largo', '350mm',
  'Peso', '2.5 kg',
  'Resistencia', '5000 N'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%suspensión%' ORDER BY id LIMIT 1 OFFSET 1);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Rótula esférica',
  'Material', 'Acero templado',
  'Diámetro', '25mm',
  'Carga máxima', '3000 kg',
  'Vida útil', '100,000 km'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%suspensión%' ORDER BY id LIMIT 1 OFFSET 2);

UPDATE productos SET especificaciones = jsonb_build_object(
  'Tipo', 'Kit de suspensión completo',
  'Componentes', '8 piezas',
  'Material', 'Acero y goma',
  'Compatibilidad', 'Universal',
  'Instalación', 'Profesional recomendada'
) WHERE id IN (SELECT id FROM productos WHERE nombre ILIKE '%suspensión%' ORDER BY id LIMIT 1 OFFSET 3);

-- Verificar que se han actualizado correctamente
SELECT nombre, especificaciones FROM productos WHERE especificaciones IS NOT NULL AND especificaciones != '{}' LIMIT 10;
