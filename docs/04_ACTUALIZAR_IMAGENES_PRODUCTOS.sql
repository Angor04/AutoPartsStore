-- ============================================================================
-- ACTUALIZAR IMÁGENES DE PRODUCTOS CON CLOUDINARY
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- Fecha: 13 de enero de 2026
-- ============================================================================

-- Neumático Michelin Pilot Sport 205/55R16
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768290298/Neum%C3%A1tico_Michelin_Pilot_Sport_20555R16_f2x1gi.webp'] 
WHERE nombre = 'Neumático Michelin Pilot Sport 205/55R16';

-- Neumático Continental EcoContact 215/60R16
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768290900/Neum%C3%A1tico_Continental_EcoContact_21560R16_bzxypq.webp'] 
WHERE nombre = 'Neumático Continental EcoContact 215/60R16';

-- Llanta de Aluminio OZ Racing 18 pulgadas
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768291044/Llanta_de_Aluminio_OZ_Racing_18_pulgadas_d2yncf.webp'] 
WHERE nombre = 'Llanta de Aluminio OZ Racing 18 pulgadas';

-- Neumático Pirelli Winter Sottozero 195/65R15
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768291161/Neum%C3%A1tico_Pirelli_Winter_Sottozero_19565R15_rdrfmz.webp'] 
WHERE nombre = 'Neumático Pirelli Winter Sottozero 195/65R15';

-- Pastillas de Freno Brembo Cerámicas 370mm
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768291472/Pastillas_de_Freno_Brembo_Cer%C3%A1micas_370mm_h1rn8g.webp'] 
WHERE nombre = 'Pastillas de Freno Brembo Cerámicas 370mm';

-- Discos de Freno Zimmermann 330mm
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768291611/Discos_de_Freno_Zimmermann_330mm_wtectl.webp'] 
WHERE nombre = 'Discos de Freno Zimmermann 330mm';

-- Líquido de Frenos DOT 4 Motul
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768291762/L%C3%ADquido_de_Frenos_DOT_4_Motul_lqrmu0.webp'] 
WHERE nombre = 'Líquido de Frenos DOT 4 Motul';

-- Cilindro Maestro de Freno TRW
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768292404/Cilindro_Maestro_de_Freno_TRW_e20sxh.webp'] 
WHERE nombre = 'Cilindro Maestro de Freno TRW';

-- Filtro de Aire Premium Bosch
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768292760/Filtro_de_Aire_Premium_Bosch_xnsitx.webp'] 
WHERE nombre = 'Filtro de Aire Premium Bosch';

-- Bujías NGK Iridium
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768292984/Buj%C3%ADas_NGK_Iridium_oxyinp.webp'] 
WHERE nombre = 'Bujías NGK Iridium';

-- Cable de Batería Profesional 4AWG
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768293177/Cable_de_Bater%C3%ADa_Profesional_4AWG_z8yazk.webp'] 
WHERE nombre = 'Cable de Batería Profesional 4AWG';

-- Correa de Distribución Gates
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768293348/Correa_de_Distribuci%C3%B3n_Gates_yyyn1g.webp'] 
WHERE nombre = 'Correa de Distribución Gates';

-- Filtro de Habitáculo Bosch Carbón Activado
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768293588/Filtro_de_Habit%C3%A1culo_Bosch_Carb%C3%B3n_Activado_k7jjay.webp'] 
WHERE nombre = 'Filtro de Habitáculo Bosch Carbón Activado';

-- Filtro de Aceite Mann Filter
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768294029/Filtro_de_Aceite_Mann_Filter_f6vubq.webp'] 
WHERE nombre = 'Filtro de Aceite Mann Filter';

-- Filtro de Combustible Mahle
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768294189/Filtro_de_Combustible_Mahle_ddqq61.webp'] 
WHERE nombre = 'Filtro de Combustible Mahle';

-- Juego de Filtros Completo (Aire, Aceite, Habitáculo)
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768294342/Juego_de_Filtros_Completo_Aire_Aceite_Habit%C3%A1culo_vasinc.webp'] 
WHERE nombre = 'Juego de Filtros Completo (Aire, Aceite, Habitáculo)';

-- Amortiguador Delantero KYB Gas-Adjust
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768294599/Amortiguador_Delantero_KYB_Gas-Adjust_hwdpza.webp'] 
WHERE nombre = 'Amortiguador Delantero KYB Gas-Adjust';

-- Amortiguador Trasero Bilstein B4
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768295809/Amortiguador_Trasero_Bilstein_B4_sctjzi.webp'] 
WHERE nombre = 'Amortiguador Trasero Bilstein B4';

-- Kit Muelles de Suspensión Lowering
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768296111/Kit_Muelles_de_Suspensi%C3%B3n_Lowering_g4joar.webp'] 
WHERE nombre = 'Kit Muelles de Suspensión Lowering';

-- Barra Estabilizadora Delantera
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768296265/Barra_Estabilizadora_Delantera_ycqpnn.webp'] 
WHERE nombre = 'Barra Estabilizadora Delantera';

-- Disco de Embrague Valeo Original
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768300941/Disco_de_Embrague_Valeo_Original_bmnsbv.webp'] 
WHERE nombre = 'Disco de Embrague Valeo Original';

-- Plato de Presión Luk Premium
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768301146/Plato_de_Presi%C3%B3n_Luk_Premium_duomud.webp'] 
WHERE nombre = 'Plato de Presión Luk Premium';

-- Cilindro Esclavo de Embrague Sachs
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768301325/Cilindro_Esclavo_de_Embrague_Sachs_km3fpf.webp'] 
WHERE nombre = 'Cilindro Esclavo de Embrague Sachs';

-- Cable de Embrague Profesional
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768301700/Cable_de_Embrague_Profesional_vxuejl.webp'] 
WHERE nombre = 'Cable de Embrague Profesional';

-- Aceite de Motor Castrol Edge 5W-40
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768302143/Aceite_de_Motor_Castrol_Edge_5W-40_y6zgxa.webp'] 
WHERE nombre = 'Aceite de Motor Castrol Edge 5W-40';

-- Líquido Refrigerante BASF Pentosin
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768302328/L%C3%ADquido_Refrigerante_BASF_Pentosin_mvahk5.webp'] 
WHERE nombre = 'Líquido Refrigerante BASF Pentosin';

-- Aceite de Dirección Asistida Mobil
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768302514/Aceite_de_Direcci%C3%B3n_Asistida_Mobil_o5uunp.webp'] 
WHERE nombre = 'Aceite de Dirección Asistida Mobil';

-- Fluido de Transmisión Automática Castrol
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768302689/Fluido_de_Transmisi%C3%B3n_Autom%C3%A1tica_Castrol_shcvm2.webp'] 
WHERE nombre = 'Fluido de Transmisión Automática Castrol';

-- Correa de Distribución Gates de Calidad Premium
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768302953/Correa_de_Distribuci%C3%B3n_Gates_de_Calidad_Premium_nv0v61.webp'] 
WHERE nombre = 'Correa de Distribución Gates de Calidad Premium';

-- Rodillo Tensor de Correa SKF
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768303452/Rodillo_Tensor_de_Correa_SKF_ntuqg7.webp'] 
WHERE nombre = 'Rodillo Tensor de Correa SKF';

-- Cadena de Distribución Dayco
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768304344/Cadena_de_Distribuci%C3%B3n_Dayco_c2zenh.webp'] 
WHERE nombre = 'Cadena de Distribución Dayco';

-- Correa de Accesorios Serpentina
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768309093/Correa_de_Accesorios_Serpentina_tl8w3l.webp'] 
WHERE nombre = 'Correa de Accesorios Serpentina';

-- Espejo Retrovisor Izquierdo Elemental
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768309283/Espejo_Retrovisor_Izquierdo_Elemental_abqrkw.webp'] 
WHERE nombre = 'Espejo Retrovisor Izquierdo Elemental';

-- Panel de Faro Frontal Compatible
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768309453/Panel_de_Faro_Frontal_Compatible_itr5l0.webp'] 
WHERE nombre = 'Panel de Faro Frontal Compatible';

-- Sellador de Carrocería 500ml
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768309697/Sellador_de_Carrocer%C3%ADa_500ml_gs29ah.webp'] 
WHERE nombre = 'Sellador de Carrocería 500ml';

-- Protector de Parachoques Goma
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768309884/Protector_de_Parachoques_Goma_i1yodb.webp'] 
WHERE nombre = 'Protector de Parachoques Goma';

-- Batería de Coche 12V 80Ah Bosch S5
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768310041/Bater%C3%ADa_de_Coche_12V_80Ah_Bosch_S5_hgwoft.webp'] 
WHERE nombre = 'Batería de Coche 12V 80Ah Bosch S5';

-- Alternador 120A Bosch
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768310213/Alternador_120A_Bosch_p2s3cy.webp'] 
WHERE nombre = 'Alternador 120A Bosch';

-- Motor de Arranque Profesional
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768331013/Motor_de_Arranque_Profesional_lkvrp1.webp'] 
WHERE nombre = 'Motor de Arranque Profesional';

-- Conector de Batería Cobre Puro
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768331187/Conector_de_Bater%C3%ADa_Cobre_Puro_cbfplt.webp'] 
WHERE nombre = 'Conector de Batería Cobre Puro';

-- Rótula de Dirección Lemförder
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768331403/R%C3%B3tula_de_Direcci%C3%B3n_Lemf%C3%B6rder_cmzzuz.webp'] 
WHERE nombre = 'Rótula de Dirección Lemförder';

-- Bieleta Estabilizadora Delantera
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768331587/Bieleta_Estabilizadora_Delantera_iakydk.webp'] 
WHERE nombre = 'Bieleta Estabilizadora Delantera';

-- Rodamiento de Rueda SKF
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768331705/Rodamiento_de_Rueda_SKF_tvc3ch.webp'] 
WHERE nombre = 'Rodamiento de Rueda SKF';

-- Brazos de Control de Suspensión
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768331940/Brazos_de_Control_de_Suspensi%C3%B3n_par_vjdjjk.webp'] 
WHERE nombre = 'Brazos de Control de Suspensión (par)';

-- Mantenedor de Batería Inteligente 2A
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768332138/Mantenedor_de_Bater%C3%ADa_Inteligente_2A_sxoppp.webp'] 
WHERE nombre = 'Mantenedor de Batería Inteligente 2A';

-- Compresor de Aire Portátil 12V
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768332242/Compresor_de_Aire_Port%C3%A1til_12V_vjmtdy.webp'] 
WHERE nombre = 'Compresor de Aire Portátil 12V';

-- Kit de Herramientas Básicas 39 piezas
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768332366/Kit_de_Herramientas_B%C3%A1sicas_39_piezas_fhcmph.webp'] 
WHERE nombre = 'Kit de Herramientas Básicas 39 piezas';

-- Limpiador de Inyectores Gasolina
UPDATE productos 
SET urls_imagenes = ARRAY['https://res.cloudinary.com/ddi0g76bk/image/upload/v1768332955/Limpiador_de_Inyectores_Gasolina_t03v7h.webp'] 
WHERE nombre = 'Limpiador de Inyectores Gasolina';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- SELECT id, nombre, urls_imagenes FROM productos WHERE nombre = 'Neumático Michelin Pilot Sport 205/55R16';
