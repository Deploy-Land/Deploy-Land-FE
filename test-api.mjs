// API 테스트 스크립트
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env 파일에서 환경 변수 읽기
function loadEnv() {
  try {
    const envFile = readFileSync(join(__dirname, ".env"), "utf-8");
    const envVars = {};
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$/);
      if (match) {
        envVars[match[1].trim()] = match[2].trim();
      }
    });
    return envVars;
  } catch (error) {
    return {};
  }
}

const env = loadEnv();
let API_BASE_URL = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || "";

// ARN 형식을 URL로 변환
function convertArnToUrl(arn, stage = null) {
  // arn:aws:apigateway:region::/apis/api-id/routes/route-id
  const match = arn.match(/arn:aws:apigateway:([^:]+)::\/apis\/([^\/]+)\/routes\//);
  if (match) {
    const region = match[1];
    const apiId = match[2];
    // stage가 없으면 여러 가능한 stage 시도
    if (!stage) {
      return {
        region,
        apiId,
        stages: ["prod", "dev", "stage", "staging", "test", "v1"]
      };
    }
    return `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`;
  }
  return arn; // 이미 URL 형식이면 그대로 반환
}

async function testAPI() {
  if (!API_BASE_URL) {
    console.error("❌ VITE_API_BASE_URL이 설정되지 않았습니다.");
    console.log("환경 변수를 설정하거나 .env 파일을 확인해주세요.");
    process.exit(1);
  }

  // ARN 형식이면 URL로 변환
  let urlInfo = null;
  if (API_BASE_URL.startsWith("arn:")) {
    console.log("⚠️  ARN 형식 감지...");
    const converted = convertArnToUrl(API_BASE_URL);
    if (typeof converted === "object" && converted.stages) {
      urlInfo = converted;
      console.log(`   Region: ${urlInfo.region}`);
      console.log(`   API ID: ${urlInfo.apiId}`);
      console.log(`   가능한 stages: ${urlInfo.stages.join(", ")}`);
      console.log("   여러 stage를 시도합니다...\n");
    } else {
      API_BASE_URL = converted;
    }
  }

  // 여러 stage 시도
  if (urlInfo && urlInfo.stages.length > 0) {
    for (const stage of urlInfo.stages) {
      const testUrl = `https://${urlInfo.apiId}.execute-api.${urlInfo.region}.amazonaws.com/${stage}`;
      console.log(`\n🔍 Testing stage: ${stage}`);
      console.log(`📍 URL: ${testUrl}`);
      
      try {
        const testResponse = await fetch(`${testUrl}/api/status/LATEST_EXECUTION`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (testResponse.ok) {
          console.log(`✅ Stage '${stage}'에서 성공!`);
          API_BASE_URL = testUrl;
          break;
        } else {
          console.log(`   ❌ ${testResponse.status} ${testResponse.statusText}`);
        }
      } catch (error) {
        console.log(`   ❌ 오류: ${error.message}`);
      }
    }
    
    if (!API_BASE_URL || API_BASE_URL.startsWith("arn:")) {
      console.error("\n❌ 모든 stage에서 실패했습니다. 실제 API Gateway URL을 확인해주세요.");
      console.log("   .env 파일의 VITE_API_BASE_URL을 다음 형식으로 설정하세요:");
      console.log("   https://{api-id}.execute-api.{region}.amazonaws.com/{stage}");
      process.exit(1);
    }
  }

  // URL 끝의 슬래시 제거
  API_BASE_URL = API_BASE_URL.replace(/\/+$/, "");

  console.log("\n🔍 API 테스트 시작...");
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log("");

  try {
    // 여러 가능한 경로 시도
    const possiblePaths = [
      "/api/status/LATEST_EXECUTION",
      "/api/status/latest",
      "/api/latest-execution",
      "/api/status/latest-execution",
    ];

    let latestData = null;
    let pipelineId = null;

    for (const path of possiblePaths) {
      console.log(`1️⃣ ${path} 호출 시도 중...`);
      const latestUrl = `${API_BASE_URL}${path}`;
      console.log(`   URL: ${latestUrl}`);
      
      try {
        const latestResponse = await fetch(latestUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(`   Status: ${latestResponse.status} ${latestResponse.statusText}`);
        
        if (latestResponse.ok) {
          latestData = await latestResponse.json();
          console.log(`   ✅ 성공:`, JSON.stringify(latestData, null, 2));
          
          pipelineId = latestData.pipelineId;
          if (pipelineId) {
            console.log(`\n✅ 올바른 경로 발견: ${path}`);
            break;
          } else {
            console.log(`   ⚠️ pipelineId가 응답에 없습니다.`);
          }
        } else {
          const errorText = await latestResponse.text();
          console.log(`   ❌ ${latestResponse.status}: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`   ❌ 네트워크 오류: ${error.message}`);
      }
      console.log("");
    }

    if (!pipelineId) {
      console.error("❌ 모든 경로에서 실패했습니다.");
      console.log("\n💡 확인 사항:");
      console.log("   1. API Gateway의 실제 경로 확인");
      console.log("   2. LATEST_EXECUTION이 특별한 키워드인지 확인");
      console.log("   3. 다른 방법으로 최신 pipelineId를 얻는 방법 확인");
      process.exit(1);
    }

    console.log("");
    console.log(`2️⃣ Pipeline Status 호출 중 (pipelineId: ${pipelineId})...`);
    
    // 2. Pipeline Status 테스트
    const statusUrl = `${API_BASE_URL}/api/status/${pipelineId}`;
    console.log(`   URL: ${statusUrl}`);
    
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`   Status: ${statusResponse.status} ${statusResponse.statusText}`);
    
    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error(`   ❌ 오류: ${errorText}`);
      process.exit(1);
    }

    const statusData = await statusResponse.json();
    console.log(`   ✅ 성공:`, JSON.stringify(statusData, null, 2));
    
    console.log("");
    console.log("✅ 모든 API 테스트 통과!");
    
  } catch (error) {
    console.error("❌ API 테스트 실패:", error.message);
    if (error.cause) {
      console.error("   원인:", error.cause);
    }
    process.exit(1);
  }
}

testAPI();

