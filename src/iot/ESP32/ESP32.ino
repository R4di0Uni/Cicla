#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include "HX711.h"
#include <MPU6050.h>

const char* ssid = "YourWiFi";
const char* password = "YourPass";
const char* mqtt_server = "192.168.x.x";

WiFiClient espClient;
PubSubClient client(espClient);

#define BUZZER_PIN 16
#define REED_PIN   17

#define HX_SCK 15
#define HX_DT  2

#define SDA_PIN 27
#define SCL_PIN 14

HX711 scale;
MPU6050 mpu;

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Received cmd: ");
  for (int i = 0; i < length; i++) Serial.print((char)payload[i]);
  Serial.println();

  if (String((char*)payload).startsWith("beep")) {
    tone(BUZZER_PIN, 1000, 300);
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP32Client")) {
      Serial.println("connected");
      client.subscribe("esp32/cmd");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2 seconds");
      delay(2000);
    }
  }
}

void setup() {

  const balancing_factor = -462.67;
  Serial.begin(115200);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(REED_PIN, INPUT_PULLUP);

  
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected!");

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

 scale.begin(HX_DT, HX_SCK);

scale.set_scale(balancing_factor);   
scale.tare();               
Serial.println("HX711 calibrated");

  Wire.begin(SDA_PIN, SCL_PIN, 400000);
  mpu.initialize();

  if (!mpu.testConnection()) {
    Serial.println("MPU6050 NOT connected!");
  } else {
    Serial.println("MPU6050 connected");
  }
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  int reedState = digitalRead(REED_PIN); 

  float weight = scale.get_units(10);

  int16_t ax, ay, az, gx, gy, gz;
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  char payload[200];
  sprintf(payload,
    "{\"reed\":%d, \"weight\":%.2f, \"ax\":%d, \"ay\":%d, \"az\":%d, \"gx\":%d, \"gy\":%d, \"gz\":%d}",
    reedState, weight, ax, ay, az, gx, gy, gz
  );

  client.publish("esp32/sensors", payload);

  Serial.println(payload);

  delay(500);  
}
