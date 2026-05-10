// Raw SVG strings for island icons.
// Using SvgXml + makeUniqueSvg instead of SVG components avoids the
// duplicate-ID bug in react-native-svg: when the same SVG component is
// rendered multiple times simultaneously, all instances share the same
// filter/gradient IDs in the native layer, corrupting each other's rendering.

// ─── Helper ──────────────────────────────────────────────────────────────────

const SVG_FILTER_KEYWORDS = new Set([
  'SourceAlpha', 'SourceGraphic', 'BackgroundImage', 'BackgroundAlpha',
  'FillPaint', 'StrokePaint', 'none',
]);

// Single-pass replacement: one scan handles id="", url(#), in="", in2="", result=""
// instead of the old approach of (1 + N_ids × 5) separate scans.
export function makeUniqueSvg(svgXml: string, instanceId: string): string {
  const idMap: Record<string, string> = {};
  svgXml.replace(/\bid="([^"]+)"/g, (_, id) => {
    idMap[id] = `${instanceId}_${id}`;
    return _;
  });
  if (Object.keys(idMap).length === 0) return svgXml;

  return svgXml.replace(
    /\bid="([^"]+)"|\burl\(#([^)]+)\)|\bin="([^"]+)"|\bin2="([^"]+)"|\bresult="([^"]+)"/g,
    (match, idVal, urlVal, inVal, in2Val, resultVal) => {
      if (idVal  !== undefined) return idMap[idVal]  ? `id="${idMap[idVal]}"` : match;
      if (urlVal !== undefined) return idMap[urlVal] ? `url(#${idMap[urlVal]})` : match;
      if (inVal  !== undefined && !SVG_FILTER_KEYWORDS.has(inVal)  && idMap[inVal])  return `in="${idMap[inVal]}"`;
      if (in2Val !== undefined && !SVG_FILTER_KEYWORDS.has(in2Val) && idMap[in2Val]) return `in2="${idMap[in2Val]}"`;
      if (resultVal !== undefined && !SVG_FILTER_KEYWORDS.has(resultVal) && idMap[resultVal]) return `result="${idMap[resultVal]}"`;
      return match;
    },
  );
}

// Removes <filter> definitions and filter="..." attributes from an SVG string.
// This eliminates the CoreGraphics bitmap context errors produced by react-native-svg
// when rendering complex multi-pass filter chains (feGaussianBlur, feColorMatrix, etc.)
// and makes each SvgXml render measurably faster.
// Gradients and clip-paths are intentionally preserved — only filter effects are stripped.
function stripFilters(svgXml: string): string {
  return svgXml
    .replace(/<filter\b[\s\S]*?<\/filter>/g, '')  // drop <filter>…</filter> defs
    .replace(/\s+filter="[^"]*"/g, '');            // drop filter="url(#…)" attrs
}

// ─── Base icon strings (Phase 1) ─────────────────────────────────────────────

export const LER_SVG = stripFilters(`<svg width="78" height="76" viewBox="0 0 78 76" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_diiii_2281_10686)">
<g filter="url(#filter1_d_2281_10686)">
<rect x="4.12988" y="28.2197" width="69.8701" height="7.92136" fill="#E5E5E5"/>
<rect x="4.12988" y="28.2197" width="69.8701" height="7.92136" fill="black" fill-opacity="0.2"/>
<g filter="url(#filter2_dd_2281_10686)">
<rect x="4" width="70" height="57" rx="28.5" fill="url(#paint0_linear_2281_10686)"/>
</g>
<path d="M30.146 16.2061C34.0686 16.2062 37.4586 18.4073 39.0649 21.6006C40.6712 18.4073 44.0613 16.2062 47.9839 16.2061H56.3091C58.3617 16.2061 60.0259 17.8133 60.0259 19.7959V37.0244C60.0259 39.0068 58.3635 40.614 56.311 40.6143H48.48C41.7637 40.6143 43.1863 43.5373 39.313 44.0381C39.246 44.0467 39.18 44.0472 39.1157 44.0439C39.0192 44.0608 38.9186 44.0673 38.8149 44.0576C34.0448 43.61 36.4688 40.4883 29.6499 40.4883H21.8198C19.7672 40.4883 18.104 38.8811 18.104 36.8984V19.7959C18.104 17.8133 19.7682 16.2061 21.8208 16.2061H30.146Z" fill="#EEEEEE" fill-opacity="0.35"/>
<path d="M32.1274 12.377C35.1131 12.377 37.7116 13.9722 39.064 16.3271C40.4162 13.9718 43.0165 12.377 46.0024 12.377H51.9487C53.5907 12.3771 54.9214 13.663 54.9214 15.249V32.4805C54.9211 34.0663 53.5916 35.3515 51.9497 35.3516H46.4976C41.8545 35.3516 41.4409 37.1025 39.8315 37.8701C39.6496 38.0799 39.3742 38.2004 39.0688 38.1514C39.0458 38.1477 39.0231 38.1417 39.0005 38.1377C38.7917 38.1661 38.5986 38.1115 38.4429 38C36.3831 37.3269 36.5658 35.3516 31.6313 35.3516H26.1792C24.5375 35.3513 23.2078 34.0662 23.2075 32.4805V15.249C23.2075 13.663 24.5391 12.377 26.1812 12.377H32.1274Z" fill="#EEEEEE" fill-opacity="0.35"/>
<path opacity="0.4" fill-rule="evenodd" clip-rule="evenodd" d="M37.5791 14.4748C38.1666 15.0124 38.669 15.6359 39.0645 16.3245C39.4607 15.6349 39.9639 15.0107 40.5524 14.4727V37.4239C40.3286 37.5908 40.0967 37.7434 39.8326 37.8695C39.6506 38.0798 39.3743 38.2009 39.0684 38.1516C39.0448 38.1478 39.0214 38.1438 38.9984 38.1398C38.7931 38.1671 38.6027 38.1127 38.4486 38.0044C38.1087 37.894 37.8298 37.7483 37.5791 37.5816V14.4748Z" fill="#EEEEEE" fill-opacity="0.35"/>
</g>
</g>
<defs>
<filter id="filter0_diiii_2281_10686" x="0" y="-4" width="78" height="69" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2281_10686"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2281_10686" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="0.5"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.999945 0 0 0 0 0.999945 0 0 0 0 0.999945 0 0 0 0.4 0"/>
<feBlend mode="normal" in2="shape" result="effect2_innerShadow_2281_10686"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-0.5"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.379316 0 0 0 0 0.379316 0 0 0 0 0.379316 0 0 0 0.4 0"/>
<feBlend mode="normal" in2="effect2_innerShadow_2281_10686" result="effect3_innerShadow_2281_10686"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="25"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/>
<feBlend mode="normal" in2="effect3_innerShadow_2281_10686" result="effect4_innerShadow_2281_10686"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-4"/>
<feGaussianBlur stdDeviation="25"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
<feBlend mode="normal" in2="effect4_innerShadow_2281_10686" result="effect5_innerShadow_2281_10686"/>
</filter>
<filter id="filter1_d_2281_10686" x="0" y="0" width="78" height="76" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="15"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2281_10686"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2281_10686" result="shape"/>
</filter>
<filter id="filter2_dd_2281_10686" x="4" y="0" width="70" height="65" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="8"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.643137 0 0 0 0 0.368627 0 0 0 0 0.333333 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2281_10686"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="8"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_2281_10686" result="effect2_dropShadow_2281_10686"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_2281_10686" result="shape"/>
</filter>
<linearGradient id="paint0_linear_2281_10686" x1="39" y1="-2.77675e-08" x2="39" y2="57" gradientUnits="userSpaceOnUse">
<stop stop-color="#7456C8"/>
<stop offset="0.365385" stop-color="#D783D8"/>
<stop offset="0.75" stop-color="#FF90A5"/>
<stop offset="1" stop-color="#FF6F5C"/>
</linearGradient>
</defs>
</svg>`);

export const DONE_SVG = stripFilters(`<svg width="78" height="76" viewBox="0 0 78 76" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_dd_917_6387)">
<g filter="url(#filter1_dd_917_6387)">
<rect x="4" width="70" height="57" rx="28.5" fill="url(#paint0_linear_917_6387)"/>
</g>
<g clip-path="url(#clip0_917_6387)">
<g clip-path="url(#clip1_917_6387)">
<path d="M36.2094 42.1164C35.9146 40.6902 34.8121 39.5827 33.5744 38.8467L34.5513 37.8656C36.0167 38.1713 37.4418 38.6181 38.8346 39.1437C37.9509 37.9513 36.2955 37.6058 35.0595 36.8681L34.6992 35.0904C35.6 34.7397 36.5151 33.9967 37.0116 33.1854C37.5081 32.374 37.6103 31.7609 36.5536 31.418C35.5166 31.0821 32.1448 31.4085 31.3167 32.1705C30.7475 32.6944 31.2378 33.5196 31.6698 33.9768C32.2201 34.5587 33.0626 34.9536 33.8558 35.1103L34.1202 36.9391L32.7552 38.3756C30.6167 37.4526 28.3312 36.8889 25.9892 36.7088C25.5375 36.6741 25.3269 36.8724 25.0822 36.449C24.8061 35.9701 24.4915 35.0575 24.4503 34.5154C24.3544 33.2408 25.0553 32.0034 25.5142 30.8621C25.6612 30.8465 25.6029 30.8639 25.6271 30.9418C25.9363 31.9523 26.5189 32.8061 27.417 33.4062C26.4741 31.5687 26.2742 29.8871 26.8434 27.8973C27.814 24.4968 30.7681 21.1007 34.2331 19.8867C34.6302 19.7473 35.1142 19.5785 35.5345 19.575L34.9179 20.7656C33.6927 21.1284 32.6064 21.8255 31.7281 22.7156L31.8446 22.7737L34.6947 22.0385C34.58 22.8507 34.5908 23.7911 35.003 24.528C35.1948 23.6188 35.4315 22.6749 35.9827 21.9034C37.4561 21.6445 38.9386 22.0117 40.4049 22.1467C39.5579 21.1761 38.1346 20.8158 36.8789 20.6314C36.8296 20.5916 37.328 20.0183 37.3835 19.956C37.5413 19.7828 38.1723 19.1524 38.3632 19.1169C40.1181 19.0061 41.8362 19.1628 43.5383 19.5776C44.7832 18.3783 46.1222 17.2751 47.403 16.1122C48.3486 15.2532 49.2377 14.2358 50.2558 13.4582C50.6852 13.1309 51.1718 12.7352 51.6558 13.2426C52.3182 13.9379 52.7941 16.443 52.8873 17.4111C53.1526 20.1612 52.6901 23.1218 50.9361 25.3584C52.752 27.8938 55.8629 30.6049 54.7749 34.014C53.0791 39.329 44.6237 40.866 39.6897 41.6739C38.5406 41.8626 37.3719 42.0384 36.213 42.1172H36.2103L36.2094 42.1164ZM50.5722 14.9043C50.1348 15.0013 48.8335 16.6872 48.5502 17.1167C47.8977 18.1073 47.1637 19.5923 47.5491 20.7821C47.7024 21.2557 48.7125 22.0757 49.1059 22.5243C49.468 22.9373 49.7952 23.3772 50.1124 23.8231C50.4208 23.5547 50.6645 23.2854 50.8779 22.9399C51.948 21.2038 52.1219 18.5731 51.8046 16.6118C51.6979 15.9512 51.5617 14.6843 50.5722 14.9034V14.9043ZM39.7497 27.1084C39.8465 27.2011 40.0132 27.2738 40.0966 27.3994L40.0804 27.544C39.7282 28.054 38.4492 28.9762 38.3112 29.52C38.1642 30.0975 38.9117 30.5036 39.3894 30.1278L41.1004 28.3735C41.6839 28.7484 42.8643 30.7019 43.6153 29.7226C44.0258 29.1875 43.5275 28.8065 43.1717 28.4263C42.8275 28.0592 42.4278 27.7362 42.08 27.3716L43.895 25.4476C44.2481 24.8536 43.7417 24.25 43.0659 24.5367C42.4762 25.1151 41.8183 25.7074 41.2653 26.3144C41.2223 26.3611 41.1829 26.4122 41.1829 26.478C41.0771 26.5499 39.7542 24.8899 39.2496 24.8562C38.745 24.8224 38.3936 25.3073 38.5227 25.7766C38.6195 26.1256 39.4504 26.8244 39.7479 27.1093H39.7488L39.7497 27.1084ZM31.3911 29.2385C31.8759 29.5511 32.6709 30.7167 33.2625 30.7028C33.7241 30.6924 34.0736 30.1573 33.8567 29.7486L32.4012 28.1899C32.8081 27.7128 33.3037 27.2703 33.7133 26.8027C33.9956 26.4806 34.3882 26.1117 34.1014 25.6675C33.9203 25.387 33.5323 25.2969 33.2392 25.4779L31.5004 27.3431C30.9859 26.9854 29.8029 25.1133 29.1029 26.0788C28.497 26.9144 30.1408 27.7206 30.4867 28.3337L28.8223 30.1374C28.4925 30.7418 29.0724 31.354 29.7195 31.005C29.9794 30.8647 30.614 30.1452 30.8587 29.888C31.037 29.6992 31.2683 29.4498 31.3902 29.2377L31.3911 29.2385ZM43.2568 34.6514C46.3257 34.1093 50.2451 32.2995 49.6867 28.6774C49.5128 27.55 48.8505 26.6044 48.2383 25.6658C48.1335 25.6528 48.1989 25.7732 48.2088 25.8295C48.3539 26.6997 48.4149 27.3968 48.2858 28.2817C47.8762 31.0959 45.5217 33.1118 43.2577 34.6514H43.2568ZM46.2235 37.3036C48.4803 37.2248 51.1665 35.9918 52.0708 33.8919C52.6946 32.4433 52.3648 30.6985 51.6245 29.3468C51.4604 31.941 50.0067 34.3033 48.0438 36.0065L46.2235 37.3036ZM29.7285 34.7232C29.4748 34.9475 29.5501 35.4289 29.9624 35.4653C30.9044 35.5502 30.4078 34.1214 29.7285 34.7232ZM38.3435 34.9354C38.0316 35.235 38.572 35.8039 38.9162 35.3536C39.2021 34.9804 38.6097 34.6791 38.3435 34.9354ZM31.5416 35.6913C31.1661 35.7995 31.1706 36.5105 31.7012 36.5442C32.3967 36.5884 32.3026 35.4722 31.5416 35.6913ZM37.449 36.126C37.2769 36.2931 37.3701 36.6222 37.6874 36.6048C38.2359 36.5754 37.7887 35.7961 37.449 36.126ZM39.6466 36.462C39.1393 36.462 39.1573 37.2534 39.7569 37.1417C40.1226 37.0733 40.0894 36.462 39.6466 36.462Z" fill="#F2F2F2" fill-opacity="0.47"/>
<path d="M33.6291 44.4503V43.5567C33.6291 43.3809 33.3934 42.7626 33.3029 42.573C33.0044 41.9452 32.4335 41.2966 31.6699 41.2568C32.464 42.205 32.7857 43.6476 32.3851 44.8174C32.2847 44.9144 30.4581 45.1681 30.3828 45.0997C30.6938 43.8216 30.1489 42.192 28.5911 42.2032C29.3019 42.9947 29.5753 44.097 29.206 45.0997C27.8885 44.9681 26.6686 44.5646 25.4425 44.1108C24.3939 43.7229 22.9231 43.2683 22.3495 42.2846C21.5016 40.8325 22.3101 39.3778 23.5586 38.472C24.1546 38.04 24.497 37.8884 25.2633 37.8971C27.6447 37.9239 31.3015 38.7422 33.2778 40.0523C34.8866 41.1191 35.9298 43.5021 33.6291 44.4494V44.4503Z" fill="#F2F2F2" fill-opacity="0.47"/>
<path d="M31.5011 19.7119L29.3465 21.442C28.7209 20.2107 27.873 18.9153 26.8002 18.0052C26.5842 17.8225 26.1118 17.4423 25.8672 17.3376C24.9305 16.9384 25.2335 18.6711 25.3043 19.1265C25.5678 20.8272 26.3359 22.501 27.1246 24.0233L26.5196 25.0147C26.4139 24.5922 26.136 24.206 25.9496 23.8068C25.0569 21.9009 23.9204 18.3368 24.2861 16.2786C24.4053 15.6083 24.7217 15.6361 25.29 15.8915C26.1459 16.276 27.2474 17.1583 28.0908 17.6761C29.2174 18.3671 30.379 19.0131 31.5002 19.7119H31.5011Z" fill="#F2F2F2" fill-opacity="0.47"/>
</g>
</g>
</g>
<defs>
<filter id="filter0_dd_917_6387" x="0" y="0" width="78" height="84" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="15"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_917_6387"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_917_6387" result="effect2_dropShadow_917_6387"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_917_6387" result="shape"/>
</filter>
<filter id="filter1_dd_917_6387" x="4" y="0" width="70" height="65" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="8"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.644231 0 0 0 0 0.367903 0 0 0 0 0.331407 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_917_6387"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="8"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_917_6387" result="effect2_dropShadow_917_6387"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_917_6387" result="shape"/>
</filter>
<linearGradient id="paint0_linear_917_6387" x1="39" y1="-2.77675e-08" x2="39" y2="57" gradientUnits="userSpaceOnUse">
<stop stop-color="#7456C8"/>
<stop offset="0.365385" stop-color="#D783D8"/>
<stop offset="0.75" stop-color="#FF90A5"/>
<stop offset="1" stop-color="#FF6F5C"/>
</linearGradient>
<clipPath id="clip0_917_6387">
<rect width="42" height="34" fill="white" transform="translate(18 11.5)"/>
</clipPath>
<clipPath id="clip1_917_6387">
<rect width="42" height="34" fill="white" transform="translate(18 11.5)"/>
</clipPath>
</defs>
</svg>`);

export const LER_BLOCK_SVG = stripFilters(`<svg width="78" height="76" viewBox="0 0 78 76" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_2281_10570)">
<rect x="4.12988" y="28.2197" width="69.8701" height="7.92136" fill="#E5E5E5"/>
<rect x="4.12988" y="28.2197" width="69.8701" height="7.92136" fill="black" fill-opacity="0.2"/>
<g filter="url(#filter1_dd_2281_10570)">
<rect x="4" width="70" height="57" rx="28.5" fill="#E5E5E5"/>
</g>
<g clip-path="url(#clip0_2281_10570)">
<path d="M60.0261 19.7958C60.0261 17.8133 58.3621 16.2061 56.3095 16.2061H47.9844C42.5107 16.2061 38.0735 20.4919 38.0735 25.7788V42.9141C38.0735 43.5749 38.6344 44.1257 39.3127 44.0381C43.1864 43.5374 41.7634 40.6145 48.4798 40.6145C50.348 40.6145 54.1476 40.6145 56.3106 40.6145C58.3633 40.6145 60.0261 39.0073 60.0261 37.0247V19.7958Z" fill="#AFAFAF"/>
<path d="M18.104 19.7958C18.104 17.8133 19.768 16.2061 21.8206 16.2061H30.1457C35.6193 16.2061 40.0566 20.4919 40.0566 25.7788V42.9141C40.0566 43.5749 39.4955 44.1214 38.8145 44.0574C34.0444 43.6098 36.4691 40.4886 29.6501 40.4886C27.7821 40.4886 23.9824 40.4886 21.8194 40.4886C19.7668 40.4886 18.104 38.8813 18.104 36.8987V19.7958Z" fill="#AFAFAF"/>
<path d="M54.922 15.2488C54.922 13.6627 53.5907 12.377 51.9487 12.377H46.0021C41.6233 12.377 38.0735 15.8057 38.0735 20.0352V37.2661C38.0735 37.7948 38.5251 38.242 39.06 38.1293C41.4089 37.6338 41.1966 35.3515 46.4977 35.3515C48.0202 35.3515 50.1925 35.3515 51.9498 35.3515C53.5918 35.3515 54.922 34.0658 54.922 32.4797V15.2488Z" fill="#D8D8D8"/>
<path d="M23.2078 15.2488C23.2078 13.6627 24.5389 12.377 26.181 12.377H32.1275C36.5065 12.377 40.0562 15.8057 40.0562 20.0352V37.2661C40.0562 37.7948 39.6086 38.2384 39.0687 38.1515C36.3063 37.707 37.0173 35.3515 31.632 35.3515C30.1095 35.3515 27.9372 35.3515 26.1799 35.3515C24.5378 35.3515 23.2078 34.0658 23.2078 32.4797V15.2488Z" fill="#D8D8D8"/>
<path opacity="0.4" fill-rule="evenodd" clip-rule="evenodd" d="M37.5791 14.4753C38.1666 15.0129 38.669 15.6363 39.0645 16.3249C39.4607 15.6354 39.9639 15.0112 40.5524 14.4731V37.4244C40.3286 37.5913 40.0967 37.7439 39.8326 37.87C39.6506 38.0803 39.3743 38.2014 39.0684 38.1521C39.0448 38.1483 39.0214 38.1443 38.9984 38.1403C38.7931 38.1676 38.6027 38.1131 38.4486 38.0049C38.1087 37.8945 37.8298 37.7488 37.5791 37.5821V14.4753Z" fill="#AFAFAF"/>
</g>
</g>
<rect x="4" width="70" height="65" rx="28.5" fill="#1A1923" fill-opacity="0.9"/>
<defs>
<filter id="filter0_d_2281_10570" x="0" y="0" width="78" height="76" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="15"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2281_10570"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2281_10570" result="shape"/>
</filter>
<filter id="filter1_dd_2281_10570" x="4" y="0" width="70" height="65" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="8"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.898039 0 0 0 0 0.898039 0 0 0 0 0.898039 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2281_10570"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="8"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_2281_10570" result="effect2_dropShadow_2281_10570"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_2281_10570" result="shape"/>
</filter>
<clipPath id="clip0_2281_10570">
<rect width="41.9221" height="33.6658" fill="white" transform="translate(18.104 11.3867)"/>
</clipPath>
</defs>
</svg>`);

export const LOCKED_SVG = stripFilters(`<svg width="78" height="76" viewBox="0 0 78 76" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_2281_10632)">
<rect x="4" y="28.5" width="70" height="8" fill="#E5E5E5"/>
<rect x="4" y="28.5" width="70" height="8" fill="black" fill-opacity="0.2"/>
<g filter="url(#filter1_dd_2281_10632)">
<rect x="4" width="70" height="57" rx="28.5" fill="#E5E5E5"/>
</g>
<path fill-rule="evenodd" clip-rule="evenodd" d="M38.8731 16.0381C34.9449 16.0381 31.7604 19.024 31.7604 22.7072V24.9829C31.7604 25.0385 31.7612 25.094 31.7626 25.1492H31.7049C29.854 25.1492 28.3535 26.6497 28.3535 28.5006V37.4417C28.3535 39.2926 29.854 40.7931 31.7049 40.7931H46.0455C47.8965 40.7931 49.397 39.2926 49.397 37.4417V28.5007C49.397 26.6497 47.8965 25.1492 46.0455 25.1492H45.9837C45.9851 25.094 45.9858 25.0385 45.9858 24.9829V22.7072C45.9858 19.0239 42.8014 16.0381 38.8731 16.0381ZM42.4812 25.1492C42.484 25.0941 42.4855 25.0387 42.4855 24.9829V22.7072C42.4855 20.8366 40.8682 19.3201 38.8731 19.3201C36.8781 19.3201 35.2608 20.8366 35.2608 22.7072V24.9829C35.2608 25.0387 35.2622 25.0941 35.2651 25.1492H42.4812Z" fill="#AFAFAF"/>
</g>
<rect x="4" width="70" height="65" rx="28.5" fill="#1A1923" fill-opacity="0.9"/>
<defs>
<filter id="filter0_d_2281_10632" x="0" y="0" width="78" height="76" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="15"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2281_10632"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_2281_10632" result="shape"/>
</filter>
<filter id="filter1_dd_2281_10632" x="4" y="0" width="70" height="65" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="8"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.898039 0 0 0 0 0.898039 0 0 0 0 0.898039 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2281_10632"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="8"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_2281_10632" result="effect2_dropShadow_2281_10632"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_2281_10632" result="shape"/>
</filter>
</defs>
</svg>`);

export const RECOMPENSA_SVG = stripFilters(`<svg width="87" height="81" viewBox="0 0 87 81" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_f_2281_10720)">
<rect x="8.6001" y="58" width="69" height="14" fill="black" fill-opacity="0.5"/>
</g>
<path d="M74.6001 29.6897L79.6001 21.6897C79.6001 21.6897 80.2824 1.06139 67.2587 0H42.6047H42.5934H17.9395C4.91596 1.06139 5.6001 21.6897 5.6001 21.6897L11.6002 29.6897L4.6001 44.6897L9.55843 61.6897C9.55843 61.6897 11.6001 68.6897 15.6001 68.6897C19.6001 68.6897 20.6001 68.6897 20.6001 68.6897H66.6001C66.6001 68.6897 66.1001 68.6897 69.6001 68.6897C73.1001 68.6897 75.6418 61.6897 75.6418 61.6897L80.6001 44.6897L74.6001 29.6897Z" fill="url(#paint0_linear_2281_10720)"/>
<g opacity="0.2">
<path d="M5.68591 21.6955C6.06092 15.9707 8.02564 3.89096 17.9395 3.08034H42.5934H42.6046H67.2585C77.1726 3.89111 79.1394 15.9753 79.5122 21.6978L79.5912 21.5803C79.5912 21.5803 80.2823 1.06139 67.2587 0H42.6046H42.5934H17.9395C4.91593 1.06139 5.60695 21.5802 5.60695 21.5802L5.68591 21.6955Z" fill="#FBFBFB"/>
</g>
<path d="M75.6001 41.6899L9.6001 41.6845L14.6001 29.6899H71.6001L75.6001 41.6899Z" fill="#2D1F1F"/>
<path d="M71.6 29.6898H14.6L9.35791 22.6899H75.9809L71.6 29.6898Z" fill="#382828"/>
<path d="M33.4213 38.4527C32.0917 38.4527 30.8095 38.1618 29.9017 37.6557C29.2089 37.2691 28.7974 36.7898 28.7974 36.3728C28.7974 35.5254 30.5996 34.293 33.4213 34.293C34.7508 34.293 36.0347 34.5838 36.9425 35.0916C37.6336 35.4766 38.0468 35.9559 38.0468 36.3728C38.0468 37.2219 36.2446 38.4527 33.4213 38.4527Z" fill="#C79F00"/>
<path d="M42.6708 38.4527C41.3412 38.4527 40.059 38.1618 39.1495 37.6557C38.4584 37.2691 38.0469 36.7898 38.0469 36.3728C38.0469 35.5254 39.8473 34.293 42.6708 34.293C44.0003 34.293 45.2825 34.5838 46.192 35.0916C46.8831 35.4766 47.2946 35.9559 47.2946 36.3728C47.2946 37.2219 45.4943 38.4527 42.6708 38.4527Z" fill="#C79F00"/>
<path d="M51.9203 38.4527C50.5907 38.4527 49.3069 38.1618 48.3991 37.6557C47.7081 37.2691 47.2947 36.7898 47.2947 36.3728C47.2947 35.5254 49.0969 34.293 51.9203 34.293C53.2499 34.293 54.532 34.5838 55.4399 35.0916C56.131 35.4766 56.5442 35.9559 56.5442 36.3728C56.5442 37.2219 54.7423 38.4527 51.9203 38.4527Z" fill="#C79F00"/>
<path d="M38.0468 35.2244C36.7172 35.2244 35.4333 34.9352 34.5255 34.4274C33.8344 34.0407 33.4211 33.5632 33.4211 33.1461C33.4211 32.2971 35.2232 31.0645 38.0468 31.0645C39.3747 31.0645 40.6585 31.357 41.5664 31.8631C42.2574 32.2482 42.6707 32.7291 42.6707 33.1461C42.6707 33.9935 40.8685 35.2244 38.0468 35.2244Z" fill="#C79F00"/>
<path d="M47.2947 35.2244C45.9668 35.2244 44.683 34.9352 43.7752 34.4274C43.0842 34.0407 42.6709 33.5632 42.6709 33.1461C42.6709 32.2971 44.4731 31.0645 47.2947 31.0645C48.6243 31.0645 49.9082 31.357 50.816 31.8631C51.5071 32.2482 51.9204 32.7291 51.9204 33.1461C51.9204 33.9935 50.1184 35.2244 47.2947 35.2244Z" fill="#C79F00"/>
<path d="M42.6708 31.9976C41.3412 31.9976 40.059 31.7067 39.1495 31.1989C38.4584 30.814 38.0469 30.3347 38.0469 29.9178C38.0469 29.0703 39.8473 27.8379 42.6708 27.8379C44.0003 27.8379 45.2825 28.1287 46.192 28.6366C46.8831 29.0216 47.2946 29.5008 47.2946 29.9178C47.2946 30.7651 45.4943 31.9976 42.6708 31.9976Z" fill="#C79F00"/>
<path d="M24.8933 41.6897H32.759C33.2095 41.3534 33.455 40.9886 33.455 40.6759C33.455 40.2589 33.0418 39.7813 32.3507 39.3946C31.4428 38.8869 30.159 38.5977 28.8295 38.5977C26.0077 38.5977 24.2056 39.8286 24.2056 40.676C24.2056 41.0021 24.4562 41.3634 24.8933 41.6897Z" fill="#C79F00"/>
<path d="M34.1428 41.6897H42.0085C42.459 41.3534 42.7029 40.9886 42.7029 40.6759C42.7029 40.2589 42.2914 39.7813 41.6003 39.3946C40.6924 38.8869 39.4086 38.5977 38.079 38.5977C35.2556 38.5977 33.4551 39.8286 33.4551 40.676C33.4552 41.0021 33.7059 41.3634 34.1428 41.6897Z" fill="#C79F00"/>
<path d="M43.3908 41.6897H51.2565C51.7071 41.3534 51.9527 40.9886 51.9527 40.6759C51.9527 40.2589 51.5411 39.7813 50.8501 39.3946C49.9405 38.8869 48.6584 38.5977 47.3288 38.5977C44.5054 38.5977 42.7031 39.8286 42.7031 40.676C42.7031 41.0021 42.9555 41.3634 43.3908 41.6897Z" fill="#C79F00"/>
<path d="M52.6403 41.6897H60.5061C60.9566 41.3534 61.2022 40.9886 61.2022 40.6759C61.2022 40.2589 60.7889 39.7813 60.0979 39.3946C59.19 38.8869 57.9062 38.5977 56.5783 38.5977C53.755 38.5977 51.9526 39.8286 51.9526 40.676C51.9526 41.0021 52.2032 41.3634 52.6403 41.6897Z" fill="#C79F00"/>
<path d="M42.1001 59.6895C44.0331 59.6895 45.6001 58.3463 45.6001 56.6895C45.6001 55.0326 44.0331 53.6895 42.1001 53.6895C40.1671 53.6895 38.6001 55.0326 38.6001 56.6895C38.6001 58.3463 40.1671 59.6895 42.1001 59.6895Z" fill="#291C1C"/>
<path d="M41.2996 58.1844C41.6294 57.5245 42.5708 57.5245 42.9006 58.1844L44.5044 61.3935C44.802 61.9888 44.3693 62.6895 43.7039 62.6895H40.4963C39.8309 62.6895 39.3982 61.9888 39.6958 61.3935L41.2996 58.1844Z" fill="#291C1C"/>
<defs>
<filter id="filter0_f_2281_10720" x="9.72748e-05" y="49.4" width="86.2" height="31.2" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feGaussianBlur stdDeviation="4.3" result="effect1_foregroundBlur_2281_10720"/>
</filter>
<linearGradient id="paint0_linear_2281_10720" x1="42.6001" y1="0" x2="42.6001" y2="68.6897" gradientUnits="userSpaceOnUse">
<stop stop-color="#453835"/>
<stop offset="1" stop-color="#322222"/>
</linearGradient>
</defs>
</svg>`);
