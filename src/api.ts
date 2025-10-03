import type { GenerateResponse, ImageProcessingOptions, ProcessingSettings, StatusResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const API_AUTH_TOKEN = import.meta.env.VITE_API_AUTH_TOKEN || ''
const AUTH_HEADER = API_AUTH_TOKEN ? { Authorization: `Bearer ${API_AUTH_TOKEN}` } : {}

type ApiStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | string

function mapApiStatus(status?: ApiStatus) {
  switch (status) {
    case 'IN_QUEUE':
      return 'queued'
    case 'IN_PROGRESS':
      return 'processing'
    case 'COMPLETED':
      return 'done'
    case 'FAILED':
      return 'error'
    case 'CANCELLED':
    case 'CANCELED':
      return 'cancelled'
    default:
      return 'pending'
  }
}

function extractImageBase64(data: any): string | undefined {
  if (!data) return undefined
  if (typeof data.imageBase64 === 'string') return data.imageBase64
  const output = data.output
  const outputs = Array.isArray(output) ? output : output ? [output] : []
  for (const item of outputs) {
    if (typeof item?.image_base64 === 'string') return item.image_base64
    if (typeof item?.image === 'string') return item.image
  }
  return undefined
}

function extractImageUrl(data: any): string | undefined {
  if (!data) return undefined
  const output = data.output ?? data
  const outputs = Array.isArray(output) ? output : [output]
  for (const item of outputs) {
    if (!item) continue
    if (typeof item === 'string') return item
    if (typeof item.message === 'string') return item.message
    if (typeof item.url === 'string') return item.url
    if (typeof item.image_url === 'string') return item.image_url
  }
  return undefined
}

export async function submitImage(
  imageBase64: string,
  options?: ImageProcessingOptions,
  settings?: ProcessingSettings,
  isPro: boolean = false
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE_URL}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...AUTH_HEADER,
    } as HeadersInit,
    body: JSON.stringify(buildGeneratePayload(imageBase64, options, settings, isPro)),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Generate request failed (${res.status}): ${text || res.statusText}`)
  }
  const data = await res.json()
  const jobId = data?.id
  if (!jobId || typeof jobId !== 'string') {
    throw new Error('Generate response missing id')
  }
  return {
    jobId,
    status: mapApiStatus(data.status),
  }
}

export async function fetchStatus(jobId: string): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE_URL}/status/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...AUTH_HEADER,
    } as HeadersInit,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Status request failed (${res.status}): ${text || res.statusText}`)
  }
  const data = await res.json()
  return {
    status: mapApiStatus(data.status),
    progress: typeof data.progress === 'number' ? data.progress : undefined,
    imageBase64: extractImageBase64(data),
    imageUrl: extractImageUrl(data),
    delayTime: typeof data.delayTime === 'number' ? data.delayTime : undefined,
    executionTime: typeof data.executionTime === 'number' ? data.executionTime : undefined,
    error: typeof data.error === 'string' ? data.error : undefined,
    jobId: typeof data.id === 'string' ? data.id : undefined,
  }
}

export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/cancel/${encodeURIComponent(jobId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...AUTH_HEADER,
    } as HeadersInit,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Cancel request failed (${res.status}): ${text || res.statusText}`)
  }
}

type WorkflowPayload = {
  input: {
    workflow: Record<string, any>
    images: Array<{
      name: string;
      image: string;
    }>
  }
}

// Keep the submitPrompt for backward compatibility
export async function submitPrompt(
  prompt: string,
  options?: ImageProcessingOptions,
  settings?: ProcessingSettings
): Promise<GenerateResponse> {
  console.warn('submitPrompt is deprecated. Use submitImage instead.');
  return submitImage(prompt, options, settings);
}

function buildGeneratePayload(
  imageBase64: string,
  options?: ImageProcessingOptions,
  settings?: ProcessingSettings,
  isPro: boolean = false
): WorkflowPayload {
  const payload: WorkflowPayload = JSON.parse(JSON.stringify(BASE_WORKFLOW_PAYLOAD));
  
  // Clean the base64 string if it includes the data URL prefix
  const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  
  // Update the image in the payload
  payload.input.images = [
    {
      name: "sample.jpg",
      image: cleanBase64
    }
  ];

  if(isPro) {
    payload.input.workflow['52']["sampler_name"] = "res_multistep_ancestral"
    payload.input.workflow['52']["scheduler"] = "kl_optimal"
  }

  // Update masking options in the FaceParsingResultsParser node (63)
  if (options && payload.input.workflow['63'] && payload.input.workflow['63'].inputs) {
    Object.keys(options).forEach(key => {
      if (key in payload.input.workflow['63'].inputs) {
        payload.input.workflow['63'].inputs[key] = options[key as keyof ImageProcessingOptions];
      }
    });
  }

  // Update settings if provided remove false
  if (settings) {
    // Update sampling steps in node 52
    if (payload.input.workflow['52'] && payload.input.workflow['52'].inputs) {
      payload.input.workflow['52'].inputs.steps = settings.samplingSteps;
      payload.input.workflow['52'].inputs.denoise = settings.denoise;
      payload.input.workflow['52'].inputs.cfg = settings.cfg;
    }

  //   // Update CFG in node 16
  //   if (payload.input.workflow['16'] && payload.input.workflow['16'].inputs) {
  //     payload.input.workflow['16'].inputs.Xi = settings.cfg;
  //     payload.input.workflow['16'].inputs.Xf = settings.cfg;
  //   }

  //   // Update denoise strength in node 15
  //   if (payload.input.workflow['15'] && payload.input.workflow['15'].inputs) {
  //     payload.input.workflow['15'].inputs.Xi = settings.denoise;
  //     payload.input.workflow['15'].inputs.Xf = settings.denoise;
  //   }

  //   // Update denoise in KSampler node 52 directly
  //   if (payload.input.workflow['52'] && payload.input.workflow['52'].inputs) {
  //     payload.input.workflow['52'].inputs.denoise = settings.denoise;
  //   }

  //   // Update LoRA strength in various nodes (22, 31, 39) if they exist
  //   const loraNodes = ['22', '31', '39'];
  //   loraNodes.forEach(nodeId => {
  //     const node = payload.input.workflow[nodeId];
  //     if (node && node.inputs) {
  //       // Update LoRA strengths in each lora_X entry
  //       for (let i = 1; i <= 4; i++) {
  //         const loraKey = `lora_${i}`;
  //         if (node.inputs[loraKey] && typeof node.inputs[loraKey] === 'object') {
  //           node.inputs[loraKey].strength = settings.loraStrengthModel;
  //         }
  //       }
  //     }
  //   });

  //   // Update LayerMask settings in node 33
  //   if (payload.input.workflow['33'] && payload.input.workflow['33'].inputs) {
  //     payload.input.workflow['33'].inputs.confidence = settings.confidence;
  //     payload.input.workflow['33'].inputs.detail_method = settings.detailMethod;
  //     payload.input.workflow['33'].inputs.detail_erode = settings.detailErode;
  //     payload.input.workflow['33'].inputs.detail_dilate = settings.detailDilate;
  //     payload.input.workflow['33'].inputs.black_point = settings.blackPoint;
  //     payload.input.workflow['33'].inputs.white_point = settings.whitePoint;
  //   }
  }

  console.log(payload)
  return payload;


}

// Export the full BASE_WORKFLOW_PAYLOAD for reference/debugging
const BASE_WORKFLOW_PAYLOAD: WorkflowPayload = {
  input: {
    workflow: {
      "1": {
        "inputs": {
          "max_shift": [
            "11",
            0
          ],
          "base_shift": [
            "10",
            0
          ],
          "width": 1024,
          "height": 1024,
          "model": [
            "22",
            0
          ]
        },
        "class_type": "ModelSamplingFlux",
        "_meta": {
          "title": "ModelSamplingFlux"
        }
      },
      "2": {
        "inputs": {
          "scheduler": "beta",
          "steps": [
            "21",
            0
          ],
          "denoise": [
            "15",
            0
          ],
          "model": [
            "1",
            0
          ]
        },
        "class_type": "BasicScheduler",
        "_meta": {
          "title": "BasicScheduler"
        }
      },
      "3": {
        "inputs": {
          "factor": [
            "4",
            0
          ],
          "start": 0,
          "end": 1,
          "sigmas": [
            "2",
            0
          ]
        },
        "class_type": "MultiplySigmas",
        "_meta": {
          "title": "Multiply Sigmas (stateless)"
        }
      },
      "4": {
        "inputs": {
          "Xi": 1,
          "Xf": 1,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Multiple Sigmas Factor"
        }
      },
      "5": {
        "inputs": {
          "Xi": 0,
          "Xf": 0.2,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Start"
        }
      },
      "6": {
        "inputs": {
          "Xi": 0,
          "Xf": 0.9,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "End"
        }
      },
      "7": {
        "inputs": {
          "Xi": 0,
          "Xf": 0,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Start_Offset"
        }
      },
      "8": {
        "inputs": {
          "Xi": 0,
          "Xf": 0,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "End Offset"
        }
      },
      "9": {
        "inputs": {
          "Xi": 0,
          "Xf": 0,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Fade"
        }
      },
      "10": {
        "inputs": {
          "Xi": 0,
          "Xf": 0.5,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Base Shift"
        }
      },
      "11": {
        "inputs": {
          "Xi": 0,
          "Xf": 0.5,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Max Shift"
        }
      },
      "12": {
        "inputs": {
          "Xi": 1,
          "Xf": 1,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Bias"
        }
      },
      "13": {
        "inputs": {
          "seed": 656957266525531
        },
        "class_type": "Seed (rgthree)",
        "_meta": {
          "title": "Seed (rgthree)"
        }
      },
      "14": {
        "inputs": {
          "Xi": 0,
          "Xf": 0.2,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Detail Amount"
        }
      },
      "15": {
        "inputs": {
          "Xi": 0,
          "Xf": 0.35,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Denoise"
        }
      },
      "16": {
        "inputs": {
          "Xi": 5,
          "Xf": 5.5,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "CFG"
        }
      },
      "17": {
        "inputs": {
          "clip_name1": "clip_l.safetensors",
          "clip_name2": "t5xxl_fp8_e4m3fn.safetensors",
          "type": "flux",
          "device": "default"
        },
        "class_type": "DualCLIPLoader",
        "_meta": {
          "title": "DualCLIPLoader"
        }
      },
      "18": {
        "inputs": {
          "samples": [
            "28",
            0
          ],
          "mask": [
            "33",
            1
          ]
        },
        "class_type": "SetLatentNoiseMask",
        "_meta": {
          "title": "Set Latent Noise Mask"
        }
      },
      "19": {
        "inputs": {
          "samples": [
            "52",
            0
          ],
          "vae": [
            "44",
            2
          ]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE Decode"
        }
      },
      "20": {
        "inputs": {
          "text_0": " brassiere<loc_177><loc_634><loc_946><loc_998>human face<loc_326><loc_121><loc_716><loc_528>woman<loc_0><loc_0><loc_998><loc_998>  beautiful face, flawless smooth skin, clean natural skin texture, fine pores, subtle tone variation, soft complexion, radiant healthy skin, high detail skin texture, natural glow, photorealistic, masterpiece ",
          "text": [
            "27",
            0
          ]
        },
        "class_type": "ShowText|pysssss",
        "_meta": {
          "title": "Show Text 🐍"
        }
      },
      "21": {
        "inputs": {
          "Xi": 3,
          "Xf": 3,
          "isfloatX": 0
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Steps"
        }
      },
      "22": {
        "inputs": {
          "PowerLoraLoaderHeaderWidget": {
            "type": "PowerLoraLoaderHeaderWidget"
          },
          "lora_1": {
            "on": false,
            "lora": "add_detail.safetensors",
            "strength": 1
          },
          "lora_2": {
            "on": false,
            "lora": "better-freckles.safetensors",
            "strength": 0.33
          },
          "lora_3": {
            "on": false,
            "lora": "flux\\flux_realism_lora.safetensors",
            "strength": 0.5
          },
          "lora_4": {
            "on": false,
            "lora": "flux\\detailed_v2_flux_ntc.safetensors",
            "strength": 0.5
          },
          "➕ Add Lora": "",
          "model": [
            "35",
            0
          ],
          "clip": [
            "17",
            0
          ]
        },
        "class_type": "Power Lora Loader (rgthree)",
        "_meta": {
          "title": "Power Lora Loader (rgthree)"
        }
      },
      "23": {
        "inputs": {
          "text": [
            "34",
            0
          ],
          "clip": [
            "31",
            1
          ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "Positive Prompt"
        }
      },
      "24": {
        "inputs": {
          "text": "(cartoon:0.5)",
          "clip": [
            "22",
            1
          ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "25": {
        "inputs": {
          "text_input": "",
          "task": "region_caption",
          "fill_mask": true,
          "keep_model_loaded": false,
          "max_new_tokens": 1024,
          "num_beams": 3,
          "do_sample": true,
          "output_mask_select": "",
          "seed": 992016962390490,
          "image": [
            "56",
            0
          ],
          "florence2_model": [
            "43",
            0
          ]
        },
        "class_type": "Florence2Run",
        "_meta": {
          "title": "Florence2Run"
        }
      },
      "26": {
        "inputs": {
          "sampler_name": "heunpp2"
        },
        "class_type": "KSamplerSelect",
        "_meta": {
          "title": "KSamplerSelect"
        }
      },
      "27": {
        "inputs": {
          "part1": "",
          "part2": [
            "25",
            2
          ],
          "part3": " beautiful face, flawless smooth skin, clean natural skin texture, fine pores, subtle tone variation, soft complexion, radiant healthy skin, high detail skin texture, natural glow, photorealistic, masterpiece",
          "part4": "",
          "separator": " "
        },
        "class_type": "CR Combine Prompt",
        "_meta": {
          "title": "⚙️ CR Combine Prompt"
        }
      },
      "28": {
        "inputs": {
          "pixels": [
            "56",
            0
          ],
          "vae": [
            "44",
            2
          ]
        },
        "class_type": "VAEEncode",
        "_meta": {
          "title": "VAE Encode"
        }
      },
      "29": {
        "inputs": {
          "amount": 0.6,
          "image": [
            "54",
            0
          ]
        },
        "class_type": "ImageCASharpening+",
        "_meta": {
          "title": "🔧 Image Contrast Adaptive Sharpening"
        }
      },
      "30": {
        "inputs": {
          "detail_amount": [
            "14",
            0
          ],
          "start": [
            "5",
            0
          ],
          "end": [
            "6",
            0
          ],
          "bias": [
            "12",
            0
          ],
          "exponent": [
            "32",
            0
          ],
          "start_offset": [
            "7",
            0
          ],
          "end_offset": [
            "8",
            0
          ],
          "fade": [
            "9",
            0
          ],
          "smooth": true,
          "cfg_scale_override": 0,
          "sampler": [
            "26",
            0
          ]
        },
        "class_type": "DetailDaemonSamplerNode",
        "_meta": {
          "title": "Detail Daemon Sampler"
        }
      },
      "31": {
        "inputs": {
          "PowerLoraLoaderHeaderWidget": {
            "type": "PowerLoraLoaderHeaderWidget"
          },
          "lora_1": {
            "on": false,
            "lora": "flux\\FLUX.1-Turbo-Alpha.safetensors",
            "strength": 1
          },
          "lora_2": {
            "on": false,
            "lora": "flux\\openflux1-v0.1.0-fast-lora.safetensors",
            "strength": 0.33
          },
          "lora_3": {
            "on": false,
            "lora": "flux\\flux_realism_lora.safetensors",
            "strength": 0.5
          },
          "lora_4": {
            "on": false,
            "lora": "flux\\detailed_v2_flux_ntc.safetensors",
            "strength": 0.5
          },
          "➕ Add Lora": "",
          "model": [
            "35",
            0
          ],
          "clip": [
            "17",
            0
          ]
        },
        "class_type": "Power Lora Loader (rgthree)",
        "_meta": {
          "title": "Power Lora Loader (rgthree)"
        }
      },
      "32": {
        "inputs": {
          "Xi": 1,
          "Xf": 1,
          "isfloatX": 1
        },
        "class_type": "mxSlider",
        "_meta": {
          "title": "Exponent"
        }
      },
      "33": {
        "inputs": {
          "face": true,
          "hair": false,
          "body": false,
          "clothes": false,
          "accessories": false,
          "background": false,
          "confidence": 0.4,
          "detail_method": "VITMatte",
          "detail_erode": 6,
          "detail_dilate": 6,
          "black_point": 0.01,
          "white_point": 0.99,
          "process_detail": true,
          "device": "cuda",
          "max_megapixels": 2,
          "images": [
            "56",
            0
          ]
        },
        "class_type": "LayerMask: PersonMaskUltra V2",
        "_meta": {
          "title": "LayerMask: PersonMaskUltra V2(Advance)"
        }
      },
      "34": {
        "inputs": {
          "text": ""
        },
        "class_type": "Text _O",
        "_meta": {
          "title": "Positive Prompt"
        }
      },
      "35": {
        "inputs": {
          "unet_name": "flux1-dev.safetensors",
          "weight_dtype": "default"
        },
        "class_type": "UNETLoader",
        "_meta": {
          "title": "Load Diffusion Model"
        }
      },
      "36": {
        "inputs": {
          "image": "sample.jpg"
        },
        "class_type": "LoadImage",
        "_meta": {
          "title": "Load Image"
        }
      },
      "37": {
        "inputs": {
          "model_name": "4x-UltraSharp.pth"
        },
        "class_type": "UpscaleModelLoader",
        "_meta": {
          "title": "Load Upscale Model"
        }
      },
      "38": {
        "inputs": {
          "vae_name": "ae.safetensors"
        },
        "class_type": "VAELoader",
        "_meta": {
          "title": "Load VAE"
        }
      },
      "39": {
        "inputs": {
          "PowerLoraLoaderHeaderWidget": {
            "type": "PowerLoraLoaderHeaderWidget"
          },
          "lora_1": {
            "on": false,
            "lora": "epiCRealness.safetensors",
            "strength": 1.04
          },
          "lora_2": {
            "on": false,
            "lora": "epiCRealismXL_KiSS_Enhancer.safetensors",
            "strength": 0.82
          },
          "lora_3": {
            "on": false,
            "lora": "epiCPhotoXL.safetensors",
            "strength": 1.5
          },
          "lora_4": {
            "on": false,
            "lora": "real_humans.safetensors",
            "strength": 1.7
          },
          "➕ Add Lora": "",
          "model": [
            "44",
            0
          ],
          "clip": [
            "44",
            1
          ]
        },
        "class_type": "Power Lora Loader (rgthree)",
        "_meta": {
          "title": "Power Lora Loader (rgthree)"
        }
      },
      "40": {
        "inputs": {
          "text": "freckles, scars, acne, blemishes, spots, moles, redness, rash, wrinkles, oily skin, pores enlarged, rough texture, plastic skin, waxy skin, airbrushed, fake textures, lowres, blurry, deformed face, face morph, cartoon, cgi, 3d render, doll-like\n",
          "clip": [
            "39",
            1
          ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "NEGATIVE"
        }
      },
      "41": {
        "inputs": {
          "text": [
            "27",
            0
          ],
          "clip": [
            "39",
            1
          ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP Text Encode (Prompt)"
        }
      },
      "43": {
        "inputs": {
          "model": "microsoft/Florence-2-base",
          "precision": "fp16",
          "attention": "sdpa",
          "convert_to_safetensors": false
        },
        "class_type": "DownloadAndLoadFlorence2Model",
        "_meta": {
          "title": "DownloadAndLoadFlorence2Model"
        }
      },
      "44": {
        "inputs": {
          "ckpt_name": "VXVI_LastFame_DMD2.safetensors"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
          "title": "Load Checkpoint"
        }
      },
      "45": {
        "inputs": {
          "x": 0,
          "y": 0,
          "resize_source": false,
          "destination": [
            "19",
            0
          ],
          "source": [
            "56",
            0
          ],
          "mask": [
            "62",
            0
          ]
        },
        "class_type": "ImageCompositeMasked",
        "_meta": {
          "title": "ImageCompositeMasked"
        }
      },
      "52": {
        "inputs": {
          "seed": 192170862448073,
          "steps": 30,
          "cfg": 1.1,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 0.3,
          "model": [
            "39",
            0
          ],
          "positive": [
            "41",
            0
          ],
          "negative": [
            "40",
            0
          ],
          "latent_image": [
            "18",
            0
          ]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "KSampler"
        }
      },
      "53": {
        "inputs": {
          "filename_prefix": "ComfyUI",
          "images": [
            "29",
            0
          ]
        },
        "class_type": "SaveImage",
        "_meta": {
          "title": "Save Image"
        }
      },
      "54": {
        "inputs": {
          "intensity": 0,
          "scale": 10,
          "temperature": 0,
          "vignette": 0,
          "image": [
            "45",
            0
          ]
        },
        "class_type": "FilmGrain",
        "_meta": {
          "title": "FilmGrain"
        }
      },
      "56": {
        "inputs": {
          "upscale_by": 2,
          "seed": [
            "13",
            0
          ],
          "steps": 1,
          "cfg": [
            "16",
            0
          ],
          "sampler_name": "euler",
          "scheduler": "beta",
          "denoise": 1,
          "mode_type": "Linear",
          "tile_width": 1024,
          "tile_height": 1024,
          "mask_blur": 8,
          "tile_padding": 32,
          "seam_fix_mode": "None",
          "seam_fix_denoise": 1,
          "seam_fix_width": 64,
          "seam_fix_mask_blur": 8,
          "seam_fix_padding": 16,
          "force_uniform_tiles": true,
          "tiled_decode": false,
          "image": [
            "36",
            0
          ],
          "model": [
            "1",
            0
          ],
          "positive": [
            "23",
            0
          ],
          "negative": [
            "24",
            0
          ],
          "vae": [
            "38",
            0
          ],
          "upscale_model": [
            "37",
            0
          ],
          "custom_sampler": [
            "30",
            0
          ],
          "custom_sigmas": [
            "3",
            0
          ]
        },
        "class_type": "UltimateSDUpscaleCustomSample",
        "_meta": {
          "title": "Ultimate SD Upscale (Custom Sample)"
        }
      },
      "57": {
        "inputs": {
          "mask": [
            "62",
            0
          ]
        },
        "class_type": "MaskToImage",
        "_meta": {
          "title": "Convert Mask to Image"
        }
      },
      "58": {
        "inputs": {
          "device": "cuda"
        },
        "class_type": "FaceParsingModelLoader(FaceParsing)",
        "_meta": {
          "title": "FaceParsingModelLoader(FaceParsing)"
        }
      },
      "59": {
        "inputs": {},
        "class_type": "FaceParsingProcessorLoader(FaceParsing)",
        "_meta": {
          "title": "FaceParsingProcessorLoader(FaceParsing)"
        }
      },
      "60": {
        "inputs": {
          "force_resize_width": 0,
          "force_resize_height": 0,
          "image": [
            "36",
            0
          ],
          "mask": [
            "57",
            0
          ]
        },
        "class_type": "Cut By Mask",
        "_meta": {
          "title": "Cut By Mask"
        }
      },
      "62": {
        "inputs": {
          "expand": -5,
          "incremental_expandrate": 0,
          "tapered_corners": true,
          "flip_input": false,
          "blur_radius": 4,
          "lerp_alpha": 1,
          "decay_factor": 1,
          "fill_holes": false,
          "mask": [
            "63",
            0
          ]
        },
        "class_type": "GrowMaskWithBlur",
        "_meta": {
          "title": "Grow Mask With Blur"
        }
      },
      "63": {
        "inputs": {
          "background": false,
          "skin": false,
          "nose": false,
          "eye_g": false,
          "r_eye": true,
          "l_eye": true,
          "r_brow": true,
          "l_brow": true,
          "r_ear": false,
          "l_ear": false,
          "mouth": true,
          "u_lip": true,
          "l_lip": true,
          "hair": false,
          "hat": false,
          "ear_r": false,
          "neck_l": false,
          "neck": false,
          "cloth": false,
          "result": [
            "65",
            1
          ]
        },
        "class_type": "FaceParsingResultsParser(FaceParsing)",
        "_meta": {
          "title": "EXCLUSION"
        }
      },
      "65": {
        "inputs": {
          "model": [
            "58",
            0
          ],
          "processor": [
            "59",
            0
          ],
          "image": [
            "36",
            0
          ]
        },
        "class_type": "FaceParse(FaceParsing)",
        "_meta": {
          "title": "FaceParse(FaceParsing)"
        }
      }
    },
    images: [
      {
        name: "sample.jpg",
        image: "" // This will be populated with the base64 image
      }
    ]
  }
}