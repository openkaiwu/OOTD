# 复制本文件为 Set-LocalEnvironment.ps1 后，按本机实际位置填写并执行。
# Set-LocalEnvironment.ps1 已被 .gitignore 忽略，绝不提交真实密码或签名路径。

$env:OOTD_NODE_HOME = 'C:\Program Files\nodejs'
$env:OOTD_JDK_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17'
$env:ANDROID_SDK_ROOT = 'C:\Android\Sdk'
$env:ANDROID_AVD_HOME = 'C:\Android\avd'

$env:OOTD_KEYSTORE_PATH = 'C:\secure\ootd-preview.keystore'
$env:OOTD_KEYSTORE_ALIAS = 'ootd-preview'
$env:OOTD_KEYSTORE_STORE_PASSWORD = '<填写签名库密码>'
$env:OOTD_KEYSTORE_KEY_PASSWORD = '<填写签名密钥密码>'
